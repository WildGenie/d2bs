#pragma once
#ifndef __CONSOLE_H__
#define __CONSOLE_H__

#include <deque>
#include <string>
#include <windows.h>

#include "Screenhook.h"
#include "D2BS.h"

class Console
{
private:
	static bool visible, enabled, initialized;
	static std::deque<std::string> lines, commands;
	static BoxHook* box;
	static TextHook* prompt;
	static TextHook* text;
	static LineHook* cursor;
	static TextHook* lineBuffers[14];
	static unsigned int lineCount, commandPos;

public:
	static void Initialize(void);
	static void Destroy(void);
	static bool IsReady(void) { return initialized; }

	static void Toggle(void);
	static void TogglePrompt(void);
	static void ToggleBuffer(void);
	static void Hide(void);
	static void HidePrompt(void);
	static void HideBuffer(void);
	static void Show(void);
	static void ShowPrompt(void);
	static void ShowBuffer(void);
	static bool IsVisible(void) { if(!IsReady()) return false; return visible; }
	static bool IsEnabled(void) { if(!IsReady()) return false; return enabled; }

	static void AddKey(unsigned int key);
	static void ExecuteCommand(void);
	static void RemoveLastKey(void);
	static void PrevCommand(void);
	static void NextCommand(void);
	static void AddLine(std::string line);
	static void Clear(void);
	static void Draw(void);
};

#endif
