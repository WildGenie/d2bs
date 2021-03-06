/*
  This program is free software; you can redistribute it and/or
  modify it under the terms of the GNU General Public License
  as published by the Free Software Foundation; either version 2
  of the License, or (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program; if not, write to the Free Software
  Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA  02111-1307, USA.
*/

#define _USE_32BIT_TIME_T

#include <sys/types.h>
#include <sys/stat.h>
#include <io.h>

#include "JSFile.h"
#include "D2BS.h"
#include "File.h"

struct FileData {
	int mode;
	char* path;
	bool autoflush, locked;
	FILE* fptr;
#if DEBUG
	char* lockLocation;
	int line;
#endif
};

EMPTY_CTOR(file)

JSBool file_equality(JSContext *cx, JSObject *obj, jsval v, JSBool *bp)
{
	*bp = JS_FALSE;
	if(JSVAL_IS_OBJECT(v) && !JSVAL_IS_VOID(v) && !JSVAL_IS_NULL(v))
	{
		FileData* ptr = (FileData*)JS_GetInstancePrivate(cx, obj, &file_class_ex.base, NULL);
		FileData* ptr2 = (FileData*)JS_GetInstancePrivate(cx, JSVAL_TO_OBJECT(v), &file_class_ex.base, NULL);
		if(ptr && ptr2 && !_strcmpi(ptr->path, ptr2->path) && ptr->mode == ptr2->mode)
			*bp = JS_TRUE;
	}
	return JS_TRUE;
}

JSAPI_PROP(file_getProperty)
{
	FileData* fdata = (FileData*)JS_GetInstancePrivate(cx, obj, &file_class_ex.base, NULL);
	struct _stat filestat = {0};
	if(fdata)
	{
		switch(JSVAL_TO_INT(id))
		{
			case FILE_READABLE:
				*vp = BOOLEAN_TO_JSVAL((fdata->fptr && !feof(fdata->fptr) && !ferror(fdata->fptr)));
				break;
			case FILE_WRITEABLE:
				*vp = BOOLEAN_TO_JSVAL((fdata->fptr && !ferror(fdata->fptr) && (fdata->mode % 3) > FILE_READ));
				break;
			case FILE_SEEKABLE:
				*vp = BOOLEAN_TO_JSVAL((fdata->fptr && !ferror(fdata->fptr)));
				break;
			case FILE_MODE:
				*vp = INT_TO_JSVAL((fdata->mode % 3));
				break;
			case FILE_BINARYMODE:
				*vp = BOOLEAN_TO_JSVAL((fdata->mode > 2));
				break;
			case FILE_LENGTH:
				if(fdata->fptr)
					*vp = INT_TO_JSVAL(_filelength(_fileno(fdata->fptr)));
				else
					*vp = JSVAL_ZERO;
				break;
			case FILE_PATH:
				*vp = STRING_TO_JSVAL(JS_NewStringCopyZ(cx, fdata->path+strlen(Vars.szScriptPath)+1));
				break;
			case FILE_POSITION:
				if(fdata->fptr)
				{
					if(fdata->locked)
						*vp = INT_TO_JSVAL(ftell(fdata->fptr));
					else
						*vp = INT_TO_JSVAL(_ftell_nolock(fdata->fptr));
				}
				else 
					*vp = JSVAL_ZERO;
				break;
			case FILE_EOF:
				if(fdata->fptr)
					*vp = BOOLEAN_TO_JSVAL(!!feof(fdata->fptr));
				else
					*vp = JSVAL_TRUE;
				break;
			case FILE_AUTOFLUSH:
				*vp = BOOLEAN_TO_JSVAL(fdata->autoflush);
				break;
			case FILE_ACCESSED:
				if(fdata->fptr)
				{
					_fstat(_fileno(fdata->fptr), &filestat);
					JS_NewNumberValue(cx, (jsdouble)filestat.st_atime, vp);
				}
				else *vp = JSVAL_ZERO;
				break;
			case FILE_MODIFIED:
				if(fdata->fptr)
				{
					_fstat(_fileno(fdata->fptr), &filestat);
					JS_NewNumberValue(cx, (jsdouble)filestat.st_mtime, vp);
				}
				else *vp = JSVAL_ZERO;
				break;
			case FILE_CREATED:
				if(fdata->fptr)
				{
					_fstat(_fileno(fdata->fptr), &filestat);
					JS_NewNumberValue(cx, (jsdouble)filestat.st_ctime, vp);
				}
				else *vp = JSVAL_ZERO;
				break;
		}
	}
	else
		THROW_ERROR(cx, "Couldn't get file object");

return JS_TRUE;
}

JSAPI_PROP(file_setProperty)
{
	FileData* fdata = (FileData*)JS_GetInstancePrivate(cx, obj, &file_class_ex.base, NULL);
	if(fdata)
	{
		switch(JSVAL_TO_INT(id))
		{
			case FILE_AUTOFLUSH:
				if(JSVAL_IS_BOOLEAN(*vp))
					fdata->autoflush = !!JSVAL_TO_BOOLEAN(*vp);
				break;
		}
	}
	else
		THROW_ERROR(cx, "Couldn't get file object");

	return JS_TRUE;
}

JSAPI_FUNC(file_open)
{
	if(argc < 2)
		THROW_ERROR(cx, "Not enough parameters, 2 or more expected");
	if(!JSVAL_IS_STRING(argv[0]))
		THROW_ERROR(cx, "Parameter 1 not a string");
	if(!JSVAL_IS_INT(argv[1]))
		THROW_ERROR(cx, "Parameter 2 not a mode");

	// check for attempts to break the sandbox and for invalid file name characters
	char* file = JS_GetStringBytes(JSVAL_TO_STRING(argv[0]));
	if(!(file && file[0] && isValidPath(file)))
		THROW_ERROR(cx, "Invalid file name");

	int32 mode;
	if(JS_ValueToInt32(cx, argv[1], &mode) == JS_FALSE)
		THROW_ERROR(cx, "Could not convert parameter 2");

	// this could be simplified to: mode > FILE_APPEND || mode < FILE_READ
	// but then it takes a hit for readability
	if(!(mode == FILE_READ || mode == FILE_WRITE || mode == FILE_APPEND))
		THROW_ERROR(cx, "Invalid file mode");

	bool binary = false, autoflush = false, lockFile = false;
	if(argc > 2 && JSVAL_IS_BOOLEAN(argv[2]))
		binary = !!JSVAL_TO_BOOLEAN(argv[2]);
	if(argc > 3 && JSVAL_IS_BOOLEAN(argv[3]))
		autoflush = !!JSVAL_TO_BOOLEAN(argv[3]);
	if(argc > 4 && JSVAL_IS_BOOLEAN(argv[4]))
		lockFile = !!JSVAL_TO_BOOLEAN(argv[4]);

	if(binary)
		mode += 3;
	static const char* modes[] = {"rt", "w+t", "a+t", "rb", "w+b", "a+b"};
	char path[_MAX_FNAME+_MAX_PATH];
	sprintf_s(path, sizeof(path), "%s\\%s", Vars.szScriptPath, file);

	FILE* fptr = NULL;
	fopen_s(&fptr, path, modes[mode]);
	if(!fptr) {
		JS_ReportError(cx, "Couldn't open file %s: %s", file, _strerror(NULL));
		return JS_FALSE;
	}

	FileData* fdata = new FileData;
	if(!fdata)
	{
		fclose(fptr);
		THROW_ERROR(cx, "Couldn't allocate memory for the FileData object");
	}

	fdata->mode = mode;
	fdata->path = _strdup(path);
	fdata->autoflush = autoflush;
	fdata->locked = lockFile;
	fdata->fptr = fptr;
	if(lockFile)
	{
		_lock_file(fptr);
#if DEBUG
		fdata->lockLocation = __FILE__;
		fdata->line = __LINE__;
#endif
	}

	JSObject* res = BuildObject(cx, &file_class_ex.base, file_methods, file_props, fdata);
	if(!res)
	{
		if(lockFile)
			fclose(fptr);
		else
			_fclose_nolock(fptr);
		delete fdata;
		THROW_ERROR(cx, "Failed to define the file object");
	}
	*rval = OBJECT_TO_JSVAL(res);
	return JS_TRUE;
}

JSAPI_FUNC(file_close)
{
	FileData* fdata = (FileData*)JS_GetInstancePrivate(cx, obj, &file_class_ex.base, NULL);
	if(fdata)
	{
		if(fdata->fptr)
		{
			if(fdata->locked)
			{
				_unlock_file(fdata->fptr);
#if DEBUG
				fdata->lockLocation = __FILE__;
				fdata->line = __LINE__;
#endif
				if(!!fclose(fdata->fptr))
					THROW_ERROR(cx, _strerror("Close failed"));
			}
			else if(!!_fclose_nolock(fdata->fptr))
				THROW_ERROR(cx, _strerror("Close failed"));
			fdata->fptr = NULL;
		}
		else
			THROW_ERROR(cx, "File is not open");
	}
	*rval = OBJECT_TO_JSVAL(obj);
	return JS_TRUE;
}

JSAPI_FUNC(file_reopen)
{
	FileData* fdata = (FileData*)JS_GetInstancePrivate(cx, obj, &file_class_ex.base, NULL);
	if(fdata)
		if(!fdata->fptr) {
			static const char* modes[] = {"rt", "w+t", "a+t", "rb", "w+b", "a+b"};
			fdata->fptr = NULL;
			fopen_s(&fdata->fptr, fdata->path, modes[fdata->mode]);
			if(!fdata->fptr)
				THROW_ERROR(cx, _strerror("Could not reopen file"));
			if(fdata->locked)
			{
				_lock_file(fdata->fptr);
#if DEBUG
				fdata->lockLocation = __FILE__;
				fdata->line = __LINE__;
#endif
			}
		} else THROW_ERROR(cx, "File is not closed");
	*rval = OBJECT_TO_JSVAL(obj);
	return JS_TRUE;
}

JSAPI_FUNC(file_read)
{
	FileData* fdata = (FileData*)JS_GetInstancePrivate(cx, obj, &file_class_ex.base, NULL);
	if(fdata && fdata->fptr)
	{
		clearerr(fdata->fptr);
		int32 count = 1;
		if(!(argc > 0 && JSVAL_TO_INT(argv[0]) > 0 && JS_ValueToInt32(cx, argv[0], &count)))
			THROW_ERROR(cx, "Invalid arguments");

		if(fdata->mode > 2)
		{
			// binary mode
			int* result = new int[count+1];
			memset(result, 0, count+1);
			uint32 size = 0;
			if(fdata->locked)
				size = fread(result, sizeof(int), count, fdata->fptr);
			else
				size = _fread_nolock(result, sizeof(int), count, fdata->fptr);

			if(size != (uint32)count && ferror(fdata->fptr))
			{
				delete[] result;
				THROW_ERROR(cx, _strerror("Read failed"));
			}
			if(count == 1)
				*rval = INT_TO_JSVAL(result[0]);
			else
			{
				JSObject* arr = JS_NewArrayObject(cx, 0, NULL);
				for(int i = 0; i < count; i++) {
					jsval val = INT_TO_JSVAL(result[i]);
					JS_SetElement(cx, arr, i, &val);
				}
				*rval = OBJECT_TO_JSVAL(arr);
			}
		}
		else
		{
			// text mode
			if(fdata->locked)
				fflush(fdata->fptr);
			else
				_fflush_nolock(fdata->fptr);

			char* result = new char[count+1];
			memset(result, 0, count+1);
			uint32 size = 0;
			if(fdata->locked)
				size = fread(result, sizeof(char), count, fdata->fptr);
			else
				size = _fread_nolock(result, sizeof(char), count, fdata->fptr);

			if(size != (uint32)count && ferror(fdata->fptr))
			{
				delete[] result;
				THROW_ERROR(cx, _strerror("Read failed"));
			}
			*rval = STRING_TO_JSVAL(JS_NewStringCopyZ(cx, result));
			delete[] result;
		}
	}
	return JS_TRUE;
}

JSAPI_FUNC(file_readLine)
{
	FileData* fdata = (FileData*)JS_GetInstancePrivate(cx, obj, &file_class_ex.base, NULL);
	if(fdata && fdata->fptr) {
		const char* line = readLine(fdata->fptr, fdata->locked);
		if(!line)
			THROW_ERROR(cx, _strerror("Read failed"));
		*rval = STRING_TO_JSVAL(JS_NewStringCopyZ(cx, line));
		delete[] line;
	}
	return JS_TRUE;
}

JSAPI_FUNC(file_readAllLines)
{
	FileData* fdata = (FileData*)JS_GetInstancePrivate(cx, obj, &file_class_ex.base, NULL);
	if(fdata && fdata->fptr) {
		JSObject* arr = JS_NewArrayObject(cx, 0, NULL);
		int i = 0;
		while(!feof(fdata->fptr)) {
			const char* line = readLine(fdata->fptr, fdata->locked);
			if(!line)
				THROW_ERROR(cx, _strerror("Read failed"));
			jsval val = STRING_TO_JSVAL(JS_NewStringCopyZ(cx, line));
			JS_SetElement(cx, arr, i++, &val);
			delete[] line;
		}
		*rval = OBJECT_TO_JSVAL(arr);
	}
	return JS_TRUE;
}

JSAPI_FUNC(file_readAll)
{
	FileData* fdata = (FileData*)JS_GetInstancePrivate(cx, obj, &file_class_ex.base, NULL);
	if(fdata && fdata->fptr) {
		if(fdata->locked)
			fseek(fdata->fptr, 0, SEEK_END);
		else
			_fseek_nolock(fdata->fptr, 0, SEEK_END);

		uint size = 0;
		if(fdata->locked)
			size = ftell(fdata->fptr);
		else
			size = _ftell_nolock(fdata->fptr);

		if(fdata->locked)
			fseek(fdata->fptr, 0, SEEK_SET);
		else
			_fseek_nolock(fdata->fptr, 0, SEEK_SET);

		char* contents = new char[size];
		uint count = 0;
		if(fdata->locked)
			count = fread(contents, sizeof(char), size, fdata->fptr);
		else
			count = _fread_nolock(contents, sizeof(char), size, fdata->fptr);

		if(count != size && ferror(fdata->fptr))
		{
			delete[] contents;
			THROW_ERROR(cx, _strerror("Read failed"));
		}
		*rval = STRING_TO_JSVAL(JS_NewStringCopyN(cx, contents, size));
		delete[] contents;
	}
	return JS_TRUE;

}

JSAPI_FUNC(file_write)
{
	FileData* fdata = (FileData*)JS_GetInstancePrivate(cx, obj, &file_class_ex.base, NULL);
	if(fdata && fdata->fptr) {
		for(uintN i = 0; i < argc; i++)
			writeValue(fdata->fptr, cx, argv[i], !!(fdata->mode > 2), fdata->locked);

		if(fdata->autoflush)
		{
			if(fdata->locked)
				fflush(fdata->fptr);
			else
				_fflush_nolock(fdata->fptr);
		}
	}
	*rval = OBJECT_TO_JSVAL(obj);
	return JS_TRUE;
}

JSAPI_FUNC(file_seek)
{
	FileData* fdata = (FileData*)JS_GetInstancePrivate(cx, obj, &file_class_ex.base, NULL);
	if(fdata && fdata->fptr)
	{
		if(argc > 0)
		{
			int32 bytes;
			bool isLines = false, fromStart = false;
			if(JS_ValueToInt32(cx, argv[0], &bytes) == JS_FALSE)
				THROW_ERROR(cx, "Could not convert parameter 1");
			if(argc > 1 && JSVAL_IS_BOOLEAN(argv[1]))
				isLines = !!JSVAL_TO_BOOLEAN(argv[1]);
			if(argc > 2 && JSVAL_IS_BOOLEAN(argv[2]))
				fromStart = !!JSVAL_TO_BOOLEAN(argv[1]);
			if(!isLines)
			{
				if(fdata->locked && fseek(fdata->fptr, _ftell_nolock(fdata->fptr)+bytes, SEEK_CUR)) {
					THROW_ERROR(cx, _strerror("Seek failed"));
				} else if(_fseek_nolock(fdata->fptr, ftell(fdata->fptr)+bytes, SEEK_CUR))
					THROW_ERROR(cx, _strerror("Seek failed"));
			}
			else
			{
				if(fromStart)
					rewind(fdata->fptr);
				// semi-ugly hack to seek to the specified line
				// if I were unlazy I wouldn't be allocating/deallocating all this memory, but for now it's ok
				while(bytes--)
					delete[] readLine(fdata->fptr, fdata->locked);
			}
		}
		else
			THROW_ERROR(cx, "Not enough parameters");
	}
	*rval = OBJECT_TO_JSVAL(obj);
	return JS_TRUE;
}

JSAPI_FUNC(file_flush)
{
	FileData* fdata = (FileData*)JS_GetInstancePrivate(cx, obj, &file_class_ex.base, NULL);
	if(fdata && fdata->fptr)
		if(fdata->locked)
			fflush(fdata->fptr);
		else
			_fflush_nolock(fdata->fptr);

	*rval = OBJECT_TO_JSVAL(obj);
	return JS_TRUE;
}

JSAPI_FUNC(file_reset)
{
	FileData* fdata = (FileData*)JS_GetInstancePrivate(cx, obj, &file_class_ex.base, NULL);
	if(fdata && fdata->fptr) {
		if(fdata->locked && fseek(fdata->fptr, 0L, SEEK_SET)) {
			THROW_ERROR(cx, _strerror("Seek failed"));
		} else if(_fseek_nolock(fdata->fptr, 0L, SEEK_SET))
			THROW_ERROR(cx, _strerror("Seek failed"));
	}
	*rval = OBJECT_TO_JSVAL(obj);
	return JS_TRUE;
}

JSAPI_FUNC(file_end)
{
	FileData* fdata = (FileData*)JS_GetInstancePrivate(cx, obj, &file_class_ex.base, NULL);
	if(fdata && fdata->fptr)
	{
		if(fdata->locked && fseek(fdata->fptr, 0L, SEEK_END)) {
			THROW_ERROR(cx, _strerror("Seek failed"));
		} else if(_fseek_nolock(fdata->fptr, 0L, SEEK_END))
			THROW_ERROR(cx, _strerror("Seek failed"));
	}
	*rval = OBJECT_TO_JSVAL(obj);
	return JS_TRUE;
}

void file_finalize(JSContext *cx, JSObject *obj)
{
	FileData* fdata = (FileData*)JS_GetInstancePrivate(cx, obj, &file_class_ex.base, NULL);
	if(fdata)
	{
		free(fdata->path);
		if(fdata->fptr)
		{
			if(fdata->locked)
			{
				_unlock_file(fdata->fptr);
#if DEBUG
				fdata->lockLocation = __FILE__;
				fdata->line = __LINE__;
#endif
				fclose(fdata->fptr);
			}
			else
				_fclose_nolock(fdata->fptr);
		}
		delete fdata;
	}
}

