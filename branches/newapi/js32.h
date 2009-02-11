#pragma once

#ifndef __JS32_H__

#define JS_THREADSAFE
#define XP_WIN

#include "js32/jsapi.h"
#include "js32/jsdbgapi.h"

#define JSAPI_FUNC(fName) JSBool fName (JSContext *cx, JSObject *obj, uintN argc, jsval *argv, jsval *rval)
#define JSAPI_PROP(fName) JSBool fName (JSContext *cx, JSObject *obj, jsval id, jsval *vp)

#define JSVAL_IS_FUNCTION(cx, var) (JSVAL_IS_OBJECT(var) && JS_ObjectIsFunction(cx, JSVAL_TO_OBJECT(var)))
#define JSVAL_TO_STR(cx, var) (JS_GetStringBytes(JS_ValueToString((cx), (var))))

#define JSPROP_CONSTANT (JSPROP_READONLY | JSPROP_ENUMERATE | JSPROP_PERMANENT)
#define JSPROP_PERMANENT_VAR (JSPROP_READONLY | JSPROP_ENUMERATE | JSPROP_PERMANENT)
#define JSPROP_STATIC_VAR (JSPROP_ENUMERATE | JSPROP_PERMANENT)

#define NUM(x) #x
#define NAME(line, v) (__FILE__ "@" NUM(line) ": " #v)
#define JS_AddRoot(cx, vp) JS_AddNamedRoot((cx), (vp), NAME(__LINE__, vp))

JSBool ThrowJSError(JSContext* cx, JSObject* obj, const char* format, ...);
JSObject* BuildObject(JSContext* cx, JSClass* classp, JSFunctionSpec* funcs, JSPropertySpec* props, void* priv = NULL, JSObject* proto = NULL, JSObject* parent = NULL);

#define THROW_ERROR(cx, obj, msg) return ThrowJSError(cx, obj, msg)

#endif __JS32_H__