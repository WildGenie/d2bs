#pragma once

#ifndef __JSDRAW_H__
#define __JSDRAW_H__

#include "js32.h"

JSAPI_FUNC(drawFrame);
JSAPI_FUNC(drawBox);
JSAPI_FUNC(drawLine);
JSAPI_FUNC(drawText);
JSAPI_FUNC(drawImage);

JSAPI_FUNC(screenToAutomap);
JSAPI_FUNC(automapToScreen);

#endif