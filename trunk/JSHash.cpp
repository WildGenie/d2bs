#include "D2BS.h"
#include "JSHash.h"
#include "Hash.h"
#include "File.h"

JSAPI_FUNC(my_md5)
{
	if(argc != 1)
		THROW_ERROR(cx, obj, "Invalid arguments");

//Oh here there
	char* result = md5(JS_GetStringBytes(JS_ValueToString(cx, argv[0])));
//Oh here there
	*rval = STRING_TO_JSVAL(JS_InternString(cx, result));
	delete result;
	return JS_TRUE;
}

JSAPI_FUNC(my_sha1)
{
	if(argc != 1)
		THROW_ERROR(cx, obj, "Invalid arguments");

//Oh here there
	char* result = sha1(JS_GetStringBytes(JS_ValueToString(cx, argv[0])));
//Oh here there
	*rval = STRING_TO_JSVAL(JS_InternString(cx, result));
	delete result;
	return JS_TRUE;
}

JSAPI_FUNC(my_sha256)
{
	if(argc != 1)
		THROW_ERROR(cx, obj, "Invalid arguments");

//Oh here there
	char* result = sha256(JS_GetStringBytes(JS_ValueToString(cx, argv[0])));
//Oh here there
	*rval = STRING_TO_JSVAL(JS_InternString(cx, result));
	delete result;
	return JS_TRUE;
}

JSAPI_FUNC(my_sha384)
{
	if(argc != 1)
		THROW_ERROR(cx, obj, "Invalid arguments");

//Oh here there
	char* result = sha384(JS_GetStringBytes(JS_ValueToString(cx, argv[0])));
//Oh here there
	*rval = STRING_TO_JSVAL(JS_InternString(cx, result));
	delete result;
	return JS_TRUE;
}

JSAPI_FUNC(my_sha512)
{
	if(argc != 1)
		THROW_ERROR(cx, obj, "Invalid arguments");

//Oh here there
	char* result = sha512(JS_GetStringBytes(JS_ValueToString(cx, argv[0])));
//Oh here there
	*rval = STRING_TO_JSVAL(JS_InternString(cx, result));
	delete result;
	return JS_TRUE;
}

JSAPI_FUNC(my_md5_file)
{
	if(argc != 1)
		THROW_ERROR(cx, obj, "Invalid arguments");

//Oh here there
	char* file = JS_GetStringBytes(JS_ValueToString(cx, argv[0]));
	if(!isValidPath(file))
		THROW_ERROR(cx, obj, "Invalid file path!");

	char path[_MAX_FNAME+_MAX_PATH];
	sprintf(path, "%s\\%s", Vars.szScriptPath, file);

	char* result = md5_file(path);
//Oh here there
	*rval = STRING_TO_JSVAL(JS_NewStringCopyZ(cx, result));
	delete result;
	return JS_TRUE;
}

JSAPI_FUNC(my_sha1_file)
{
	if(argc != 1)
		THROW_ERROR(cx, obj, "Invalid arguments");

//Oh here there
	char* file = JS_GetStringBytes(JS_ValueToString(cx, argv[0]));
	if(!isValidPath(file))
		THROW_ERROR(cx, obj, "Invalid file path!");

	char path[_MAX_FNAME+_MAX_PATH];
	sprintf(path, "%s\\%s", Vars.szScriptPath, file);

	char* result = sha1_file(path);
//Oh here there
	*rval = STRING_TO_JSVAL(JS_NewStringCopyZ(cx, result));
	delete result;
	return JS_TRUE;
}

JSAPI_FUNC(my_sha256_file)
{
	if(argc != 1)
		THROW_ERROR(cx, obj, "Invalid arguments");

//Oh here there
	char* file = JS_GetStringBytes(JS_ValueToString(cx, argv[0]));
	if(!isValidPath(file))
		THROW_ERROR(cx, obj, "Invalid file path!");

	char path[_MAX_FNAME+_MAX_PATH];
	sprintf(path, "%s\\%s", Vars.szScriptPath, file);

	char* result = sha256_file(path);
//Oh here there
	*rval = STRING_TO_JSVAL(JS_NewStringCopyZ(cx, result));
	delete result;
	return JS_TRUE;
}

JSAPI_FUNC(my_sha384_file)
{
	if(argc != 1)
		THROW_ERROR(cx, obj, "Invalid arguments");

//Oh here there
	char* file = JS_GetStringBytes(JS_ValueToString(cx, argv[0]));
	if(!isValidPath(file))
		THROW_ERROR(cx, obj, "Invalid file path!");

	char path[_MAX_FNAME+_MAX_PATH];
	sprintf(path, "%s\\%s", Vars.szScriptPath, file);

	char* result = sha384_file(path);
//Oh here there
	*rval = STRING_TO_JSVAL(JS_NewStringCopyZ(cx, result));
	delete result;
	return JS_TRUE;
}

JSAPI_FUNC(my_sha512_file)
{
	if(argc != 1)
		THROW_ERROR(cx, obj, "Invalid arguments");

//Oh here there
	char* file = JS_GetStringBytes(JS_ValueToString(cx, argv[0]));
	if(!isValidPath(file))
		THROW_ERROR(cx, obj, "Invalid file path!");

	char path[_MAX_FNAME+_MAX_PATH];
	sprintf(path, "%s\\%s", Vars.szScriptPath, file);

	char* result = sha512_file(path);
//Oh here there
	*rval = STRING_TO_JSVAL(JS_NewStringCopyZ(cx, result));
	delete result;
	return JS_TRUE;
}