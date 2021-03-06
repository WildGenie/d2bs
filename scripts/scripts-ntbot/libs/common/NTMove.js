/// <reference path="/../../d2bsAPI.js" /> 

var NTM_AreaWPArray = [
    0,    0x01, 0, 0x03, 0x04, 0x05, 0x06, 0,    0,    0,    0,    0,    0,    0,    0,    0,    // 0..15
    0,    0,    0, 0,    0,    0,    0,    0,    0,    0,    0,    0x1b, 0,    0x1d, 0,    0,    // 16..31
    0x20, 0,    0, 0x23, 0,    0,    0,    0,    0x28, 0,    0x2a, 0x2b, 0x2c, 0,    0x2e, 0,    // 32..47
    0x30, 0,    0, 0,    0x34, 0,    0,    0,    0,    0x39, 0,    0,    0,    0,    0,    0,    // 48..63
    0,    0,    0, 0,    0,    0,    0,    0,    0,    0,    0x4a, 0x4b, 0x4c, 0x4d, 0x4e, 0x4f, // 64..79
    0x50, 0x51, 0, 0x53, 0,    0,    0,    0,    0,    0,    0,    0,    0,    0,    0,    0,    // 80..95
    0,    0,    0, 0,    0,    0x65, 0,    0x67, 0,    0,    0x6a, 0x6b, 0,    0x6d, 0,    0x6f, // 96..111
    0x70, 0x71, 0, 0x73, 0,    0x75, 0x76, 0,    0,    0,    0,    0x7b, 0,    0,    0,    0,    // 112..127
    0,    0x81, 0, 0,    0]; // 128..132
    
var NTM_Waypoints = [
    0x01, 0x03, 0x04, 0x05, 0x06, 0x1b, 0x1d, 0x20, 0x23,  // 0 ..8  act1
    0x28, 0x30, 0x2a, 0x39, 0x2b, 0x2c, 0x34, 0x4a, 0x2e,  // 9 ..17 act2
    0x4b, 0x4c, 0x4d, 0x4e, 0x4f, 0x50, 0x51, 0x53, 0x65,  // 18..26 act3
    0x67, 0x6a, 0x6b,                                      // 27..29 act4
    0x6d, 0x6f, 0x70, 0x71, 0x73, 0x7b, 0x75, 0x76, 0x81]; // 30..38 act5
var usedWp = false;

function NTM_MoveTo(x, y, retry, clearpath)
{
	debugPrint("ntm moveto x:"+x+" y:"+y );
	var tempAction = currentAction; 
	var _walk;
	var _path;
	var _result;
	var _retry = 0;

	if(!NTC_WaitCastDone())
		return false;

	if(x == me.x && y == me.y)
		return true;

	if(arguments.length < 3)
		retry = 3;

	if(arguments.length < 4)
		clearpath = false;

	if(NTC_InTown() || NTC_CheckSkill(54) < 1 || !me.useTeleport)
		_walk = true;
	else
		_walk = false;

	if (!_walk && getDistance(me.x,me.y,x,y)<30) //optimzation  By Fr3DBr
		return NTM_TeleportTo(x, y);		
	//print("getpath("+me.area+", "+me.x+", "+me.y+", "+x+", "+y+", "+!_walk+")");

	_path = undefined;

	//while(_path === undefined)
	//{
		//try {
		var start = getTickCount()
			if (_walk)
				_path = getPath(me.area, me.x, me.y, x, y,!_walk);
			else
				_path = getPath(me.area, me.x, me.y, x, y,!_walk,40);
				debugPrint ("path.toSource "+_path.toSource());
			if(!_path && !_walk)  //tele path failed trying walking path
				_path = getPath(me.area, me.x, me.y, x, y,_walk,40);	
		//} catch(e) { x--; y--; }
	//}
	//print("getpath took " + (getTickCount()-start) +" Miliseconds, dist :"+ getDistance(me.x,me.y,x,y) +" result " +_path.toSource() )
	if((!_path) || (_path.length == 0))
	{
		print("getpath("+me.area+","+me.x+","+me.y+","+x+","+y+","+!_walk+") failed");
		return false;
	}
	
	for(var i = 0 ; i < _path.length ; i++)
	{
	if (tempAction != currentAction) {
		print("breaking Out of Moveto");
		return false;
	}
		if(_walk)
			_result = NTM_WalkTo(_path[i].x, _path[i].y);
		else
			_result = NTM_TeleportTo(_path[i].x, _path[i].y);

		if(_result)
		{
			if(clearpath)
			{
				NTA_ClearPosition(25, 0x04);
				NTA_ClearPosition(25);
				NTSI_PickItems();
				NTT_CleanPotions();

				NTM_MoveTo(_path[i].x, _path[i].y, 2);
			}
		}
		else
		{
			if(_retry++ < retry)
			{
				_path = getPath(me.area, me.x, me.y, x, y,!_walk);

				if((!_path) || (_path.length == 0))
				{
					print("getpath2("+me.area+","+me.x+","+me.y+","+x+","+y+","+!_walk+") failed");
					return false;
				}

				i = -1;
			}
			else
				return false;
		}
	}

	return true;
}


function NTM_MoveToObject(unittype, low, high, offsetx, offsety, clearpath)
{
	debugPrint("ntm movetoObject" );
	
	var _unit;

	if(arguments.length < 3)
		high = low;

	if(arguments.length < 4)
	{
		offsetx = 0;
		offsety = 0;
	}

	if(arguments.length < 6)
		clearpath = false;

	_unit = NTC_GetPresetUnits(unittype);

	if(!_unit)
	{
		print("cant find unit");
		debugPrint("ntm cant find presets" );
		return false;
		
	}
	
	debugPrint("ntm getpresets len:"+_unit.length );
	
	for(var i = 0 ; i < _unit.length ; i++)
	{

		if(_unit[i].id >= low && _unit[i].id <= high)
		{
			return NTM_MoveTo(_unit[i].roomx*5+_unit[i].x+offsetx, _unit[i].roomy*5+_unit[i].y+offsety, 3, clearpath);
		}
	}	
	print("Failed to find PresetUnit");
	return false;
}

function NTM_TeleportTo(x, y)
{
	debugPrint("ntm teleportto X:"+x+" Y: "+y );
	
	var _destx, _desty;

	_destx = x;
	_desty = y;

	for(var i = 0 ; i < 20 ; i++)
	{
		if((i % 10) == 0)
		{
			if(i > 0)
			{
				_destx = x + rnd(-2, 2);
				_desty = y + rnd(-2, 2);
			}

			NTC_DoCast(54, NTC_HAND_RIGHT, _destx, _desty);
		}

		NTC_Delay(25);

		if(Math.abs(me.x-_destx) < 4 && Math.abs(me.y-_desty) < 4)
			return true;
	}

	return false;
}

function NTM_WalkTo(x, y)
{
	debugPrint("ntm walkTo" );
if(getUIFlag(0x0C) || getUIFlag(0x0D) || getUIFlag(0x14) || getUIFlag(0x19) || getUIFlag(0x1A)|| getUIFlag(0x08) || getUIFlag(0x17))
		me.cancel();
	var _startx, _starty;
	var _currdestx, _currdesty;
	var _thrash = 0;

	if(Math.abs(me.x-x) < 2 && Math.abs(me.y-y) < 2)
		return true;

	if(me.runwalk == 0)
		me.runwalk = 1;

	_startx = me.x;
	_starty = me.y;
	_currdestx = x;
	_currdesty = y;

	for(var i = 0 ; i < 250 ; i++)
	{
		if((Math.abs(me.x-x) > 4 || Math.abs(me.y-y) > 4) && me.mode != 17)
		{
			_currdestx += rnd(-2, 2);
			_currdesty += rnd(-2, 2);

			NTC_DoClick(NTC_CLICK_LDOWN, NTC_SHIFT_NONE, _currdestx, _currdesty);

			NTC_Delay(NTC_DELAY_FRAME);

			if(Math.abs(me.x-_startx) < 2 && Math.abs(me.y-_starty) < 2)
			{
				if(_thrash >= 75)
				{
					var a = Math.atan2(_currdestx-_startx, _currdesty-_starty);
					a = Math.floor(a*100) + 157; // + pi/2;
					var direction = rnd(a, a+314)/100; // + pi
					_currdestx = Math.floor(Math.sin(direction)*20) + me.x;
					_currdesty = Math.floor(Math.cos(direction)*20) + me.y;

					_thrash = 0;
				}
				else
					_thrash++;
			}
			else
			{
				_startx = me.x;
				_starty = me.y;
				_currdestx = x;
				_currdesty = y;
			}
		}
		else
			break;
	}

	if(Math.abs(me.x-x) > 4 || Math.abs(me.y-y) > 4)
		return false;

	return true;
}

function NTM_TakeStairs(low, high, area)
{
	debugPrint("ntm takeStairs low:"+low+" High:"+high+" area:"+area );
	var _unit;
	var _prearea;

	if(arguments.length < 3)
		area = me.area;

	if(arguments.length < 2)
		_unit = NTC_GetUnit(NTC_UNIT_OBJECT, low);
	else
		_unit = NTM_GetStairsInt(low, high, area);

	if(!_unit){
	debugPrint("ntm takeStairs Failed: low:"+low+" High:"+high+" area:"+area );
		return false;
	}
	_prearea = me.area;

	for(var i = 0 ; i < 100 ; i++)
	{
		if((i % 25) == 0)
		{
			if(NTM_GetCloserInt(_unit))
				_unit.interact();				
		}

		NTC_Delay(NTC_DELAY_FRAME);

		if(me.area != _prearea)
			break;
	}
	preWalkDelay();

	while(me.area == 0)
		NTC_Delay(NTC_DELAY_FRAME);
	
	if(me.area == _prearea)
		return false;

	//NTC_PingDelay(NTConfig_AreaDelay);
	debugPrint("ntm takeStairsDelay" );
	postWalkDelay();
	delay(50);
   	return true;
}
function postWalkDelay(){
	debugPrint("ntm postWalkDelay" );
	while (me.mode == 2 || me.mode == 6){
	delay(40);
	debugPrint("ntm takeStairsDelay walking" );	
	}
	delay(200);
	me.cancel(0);
	 sendCopyData(null, "OOG", 0,"Info "+NTAR_Areas[me.area]);
}

function preWalkDelay(){
	var pwTimeouts =0;
	debugPrint("preWalkDelay" );
	while ((!(me.mode == 2 || me.mode == 6)) && (pwTimeouts < 10)){
	delay(40);
		pwTimeouts = pwTimeouts +1;
			
	debugPrint("ntm Prewalking delay"+pwTimeouts );	
	}

}

function NTM_UsePortal(how, dest, ownername, portal)
{
	debugPrint("ntm usePortal" );
	if(me.area == dest)
		return true;

	if(NTC_InTown())
		NTT_MenuCancel();

	var _errorcode = NTM_ChangeAreaInt(how, dest, ownername, portal);

	if(_errorcode > 0)
	{
		delay(400);
		return true;
	}
	if (_errorcode==-1)
		print("correct portal not found");
	else
		print("errorcode "+_errorcode);
	return false;
}

function NTM_GoToTown()
{
	// NTC_DebugPrint('');
	// Check if in town;
	if(me.inTown)
		return true;
	// Attempt to locate a nearby portal
	var portal = NTC_GetUnit(NTC_UNIT_OBJECT, 'Portal');
	
	if(portal)
	{
		//	TODO : Have this find the CLOSEST party portal, not just the first match
		do
		{
			if(portal.type == NTC_UNIT_OBJECT && portal.mode == 2 && portal.parentInParty)
			{
				NTM_MoveTo(portal.x, portal.y, 5, false);
				portal.interact();
				return true;
			}
		}while(portal.getNext());
	}
	
	// Attempt to make portal as a backup plan
	var destination = NTC_ActNumberToTownID[(me.act - 1)];
	if(!NTM_MakeTP(destination))
		return false;
		
	return true;
}

function NTM_MakeTP(dest)
{
	debugPrint("makeTp" );
	var _usetp = true;
	var _portal;

	if(NTC_InTown())
		return true;

	if(arguments.length < 1)
		_usetp = false;

	if(!NTC_DoCast(220, NTC_HAND_RIGHT))
		return false;

	NTC_PingDelay(250);

	for(var i = 0 ; i < 12 ; i++)
	{
		_portal = NTC_GetUnit(NTC_UNIT_OBJECT, "Portal");

		if(_portal)
		{
			do
			{
				if(_portal.type == NTC_UNIT_OBJECT && _portal.mode == 2 && NTC_CheckOwner(_portal))
				{
					if(_usetp)
						return NTM_UsePortal("BluePortal", dest, me.name, copyUnit(_portal));

					return true;
				}
			} while(_portal.getNext());
		}

		NTC_Delay(250);
	}

	return false;
}

// Internal function
function NTM_ChangeAreaInt(how, dest, ownername, myportal)
{
	debugPrint("ntm changeAreaint how:"+how+" Dest:"+dest );
	var _portal, _wpHex;
	var _playerportal = false;
	var _prearea;
	var _warpstart;
	me.cancel(0);
	if(how == "BluePortal")
	{
		if(!ownername)
			ownername = me.name;

		how = "Portal";
		_playerportal = true;
	}

	if(arguments.length > 3 && myportal)
		_portal = copyUnit(myportal);
	else if(how == "Portal")
	{
		_portal = NTM_FindCorrectPortalInt(_playerportal, ownername);

		if(typeof(_portal) === "object")
			if(_portal.objtype != dest)
				_portal = NTM_FindPortalAreaInt(dest);
			
		if(_portal < 0)
			_portal = NTM_FindPortalAreaInt(dest);
	
		if(_portal == -1)
			return -1;
	}
	else
	{
		_wpHex = NTM_AreaWPArray[dest];

		if(!_wpHex)
			return -4;

		_portal = NTC_GetUnit(NTC_UNIT_OBJECT, how);
	}

	if(!_portal)
		return -1;

	_prearea = me.area;
	_warpstart = getTickCount();

	if(how == "Waypoint")
	{
		var i;

		for(i = 0 ; i < 5 ; i++)
		{
			NTC_Delay(150);

			if(getUIFlag(0x14))
			{
				NTC_PingDelay(500);
				break;
			}else{
				_portal.move();
				NTC_Delay(1000);
				_portal.interact();
			}
		}

		if(i >= 5 || !NTM_CheckWPInt(_wpHex))
		{
		print("checkwaypoint failed "+_wpHex+" getUIFlag(0x14)="+getUIFlag(0x14) +" ping "+ me.ping);
			me.cancel(0);
			return -5;
		}
		_portal.interact(_wpHex);
/*
		for(i = 0 ; i < 200 ; i++)
		{
			if((i % 25) == 0)
			{
				if(NTM_GetCloserInt(_portal))
					_portal.interact(_wpHex);
			}

			NTC_Delay(NTC_DELAY_FRAME);

			if(me.area != _prearea)
				break;
			if(i >= 150 && !NTM_CheckWPInt(_wpHex))
			{
			me.cancel(0);
			print("Waypoint not Found! area:"+dest );
			return -5;
			}
		}
		*/
		preWalkDelay();
	}

	else
	{
		for(var i = 0 ; i < 100 ; i++)
		{
			if((i % 25) == 0)
			{
				if(NTM_GetCloserInt(_portal))
					_portal.interact();
			}

			NTC_Delay(NTC_DELAY_FRAME);

			if(me.area != _prearea)
				break;
		}
		preWalkDelay();
	}

	while(me.area == 0){
		debugPrint("ntm getstairsint area is 0 delay" );
		NTC_Delay(NTC_DELAY_FRAME);
	}

	if(how == "Waypoint")
	{
		while(getUIFlag(0x14))
		{
			me.cancel(0);
			NTC_Delay(100);
		}
	}

	postWalkDelay();
	if(how == "Waypoint"){
	var timeout = 0
		while(me.area != dest)
			{					
				NTC_Delay(100);
				timeout ++;
				if (timeout >200){
					print("extra delay failed me.area :"+me.area+" dest "+dest );
					return -7;
				}
			}
	}
	if(me.area != dest)
		return -7;

	delay(50);
	return 1;
}

function NTM_GetStairsInt(lo, hi, area)
{
	debugPrint("ntm getstairsint" );
	var _tile = NTC_GetUnit(NTC_UNIT_TILE);

	if(_tile)
	{
		do
		{
			if(_tile.type == NTC_UNIT_TILE && _tile.classid >= lo && _tile.classid <= hi)
			{
				if(!area || _tile.area == area)
					return copyUnit(_tile);
			}
		} while(_tile.getNext());
	}

	return false;
}

function NTM_CheckWPInt(wpHex)
{
	debugPrint("ntm checkwpInt" );
	for(var i = 0 ; i < 39 ; i++)
	{
		if(wpHex == NTM_Waypoints[i])
			return getWaypoint(i);
	}
return false;
}

function NTM_FindCorrectPortalInt(blueportal, ownername)
{
	debugPrint("ntm findCorrectPortal" );
	var _portal = NTC_GetUnit(NTC_UNIT_OBJECT, "Portal");

	if(blueportal)
	{
		if(_portal)
		{
			do
			{
				if(_portal.type == NTC_UNIT_OBJECT && _portal.mode == 2 && NTC_CheckOwner(_portal, ownername) && getDistance(me, _portal) < 30)
					return copyUnit(_portal);
			} while(_portal.getNext());
		}

		return -2;
	}
	else if(_portal)
	{
		do
		{
			if(_portal.type == NTC_UNIT_OBJECT && _portal.mode == 2 && !_portal.getParent())
				return copyUnit(_portal);
		} while(_portal.getNext());
	}

	return -3;
}

function NTM_FindPortalAreaInt(dest)
{
	debugPrint("ntm FindPortalareaInt" );
	var _portal = NTC_GetUnit(NTC_UNIT_OBJECT, "Portal");

	if(_portal)
	{
		do
		{
			if(_portal.type == NTC_UNIT_OBJECT && _portal.mode == 2 && _portal.objtype == dest)
			{
				if(_portal.getParent())
				{
					if(NTC_CheckOwner(_portal) || NTC_InMyParty(_portal.getParent()))
						return copyUnit(_portal);
				}
				else
					return copyUnit(_portal);
			}
		} while(_portal.getNext());
	}

	return false;
}

function NTM_GetCloserInt(object)
{
	debugPrint("ntm getCloser" );
	if(getDistance(me, object) > 2)
		return NTM_MoveTo(object.x, object.y);

	return true;
}

function NTM_TravelTO(area)
{ 
	var tries = 0;// moved this out of loop
	var stuckAtWP = false;
	var StuckAtWPRetries = 5; // times to go to stash in town before you quit();
	while (me.area != area){	
	var notFound = false;
	
	var tempAction = currentAction;
	var nextlvl =area;
		while(!notFound){
		
		//print("second loop "+nextlvl);
		NTC_Delay(10);
			if (tries >50){
			//print ("failed to travel to "+area);
			return false;
			}
			
			if(NTC_InTown()){			
				if (!usedWp){					
					NTTM_TownMove("waypoint")
					NTM_ChangeAreaInt("Waypoint",me.area);	
					usedWp=true;
					}
					
				if (NTM_FindPortalAreaInt(nextlvl)){			
					NTM_ChangeAreaInt("Portal",nextlvl,null,NTM_FindPortalAreaInt(nextlvl));
					NTTM_TownMove("portalspot");
					//print("break 1");
					break;
				}
				if (NTM_AreaWPArray[nextlvl] && NTM_CheckWPInt(NTM_AreaWPArray[nextlvl])){
					if (stuckAtWP == nextlvl){
						NTTM_TownMove("stash");
						stuckAtWP = false;
						StuckAtWPRetries = StuckAtWPRetries-1;
						if(StuckAtWPRetries == 0)
							quit();  // we got stuck give up :(					

					}
					NTTM_TownMove("waypoint")					 
					NTM_ChangeAreaInt("Waypoint",nextlvl);		
					//print("break 2");
					stuckAtWP = nextlvl
					usedWp=true;
					break;
				}
			}
			if (NTM_GotoLevel(nextlvl,true)){
				//print("break 3");
				break;
				
			}
			if (!usedWp && NTM_AreaWPArray[nextlvl]){
				NTM_GotoWaypoint(me.area,true,100)
				usedWp=true;
			}
			if (NTM_AreaWPArray[nextlvl] && NTM_CheckWPInt(NTM_AreaWPArray[nextlvl])){
			//closer waypoint found but were not in town
				if(NTM_GotoWaypoint(me.area,false,100)){						
					NTM_UsePortal("Waypoint", nextlvl)						
					break;					
				}
				if (NTTMGR_CheckScrolls(1) > 0){
					NTTM_CheckAct()
					NTTMGR_TownManager();
					NTTM_TownMove("waypoint")
					break;
				}
				if(NTM_GotoWaypoint(me.area)){					
					NTM_UsePortal("Waypoint",nextlvl)						
					break;					
				}
					
			}			
			var curlvl =nextlvl;
			nextlvl =NTAR_PreviousAreas[curlvl];	
			if (me.area == area)
				notFound = true;
		}
		NTP_UpdatePrecast();
	}
	return true;
}

function NTM_TravelToUser(username, minRange)
{
	// NTC_DebugPrint(arguments.callee.name + ' error, username not a string : '+ arguments.toArray().toSource());
	// Validate and handle arguments
	if(arguments.length == 0)
		return false;
	if(arguments.length < 2)
		minRange = 5;
	if(!(username.isString) || !(minRange.isNumber))
		return false;

	// Get user's area
	var userArea = NTAR_GetUserArea(username);
	
	// Move to user's area
	if(userArea && (me.area != userArea))
		NTM_TravelTO(userArea);
	
	// Locate user Unit and MoveTo user 
	var user = getUnit(0, username);
	if(user)
	{
		// NTC_DebugPrint('Moving to: '+ user.x +', '+ user.y);
		if(getDistance(user.x, user.y, me.x, me.y) > minRange)
			NTM_MoveTo(user.x, user.y);
			
		return true;
	}
	
	// Couldn't find user Unit, so trying to get coordinates from Party 
	var area = 0;
	var leadx = 0;
	var leady = 0;
	user = getParty().getUser(username);
	
	if(user)
	{
		area = user.area;
		leadx = user.x;
		leady = user.y;
	}
	
	if (area == 0)
		return false;
		
	if (leadx != 0)
		NTM_MoveTo(leadx, leady);

	return true;
}

function NTM_OpenDoor(){ // only opens act 4 town door atm
var myDoor = getUnit(2);
				if(myDoor){
					do{
						if(myDoor.name == "gate" && getDistance(me, myDoor) < 10){
							while(myDoor.mode == 0){
								clickMap( 0, 0, myDoor );
								NTC_Delay(rnd(10,20));
								clickMap( 2, 0, myDoor );
								NTC_Delay(200);
								//myDoor.interact();
							}						
						}
					}while(myDoor.getNext());					
				}
}

function NTM_GotoLevel( exitAreaId, goThru) {
		if(typeof(getExits) == 'function'){
			var exit = getExits(getArea(me.area));
			//print("1.1.2");
		}else{	
			var exit = getArea().exits;				
		}			
		if(exitAreaId == 50 && me.area == 40){
			NTM_MoveTo(5055,5142);
			for(var n in exit) {
			if(exit[n].id == exitAreaId) 
				return NTM_takeTile(exit[n].tileid);			
			}
		}
		if(exitAreaId == 51 && me.area == 50){
			NTM_MoveTo(10041,5081);
			NTM_takeTile(29)		
			return true;
        }

        if (exitAreaId == 74 && me.area == 54) {  //palace to arcane
            NTM_MoveToObject(NTC_UNIT_OBJECT, 298, 298, 0, 0)
            var _unit = NTC_GetUnit(NTC_UNIT_OBJECT, 298);
            _unit.interact();
            _unit.interact();
            if(!goThru) return false
             NTC_Delay(250);
             if (!NTM_UsePortal("Portal", 74))
                 return false;
             else
                 return true;
        }
		if(exitAreaId == 110 && me.area == 109){ //bloody hills
			NTM_MoveTo(5065,5098);	
			NTM_MoveTo(5025,5096);
			NTM_OpenDoor();	
            		
		}
		if(exitAreaId == 38 && me.area == 4){ //trist
			if(!NTM_MoveToObject(NTC_UNIT_OBJECT, 17, 17, 5, 5))
				return false;			
			NTC_Delay(500);
			if(goThru){
				if(!NTM_UsePortal("Portal", 38)){
					print("Portal Not found");
					return false;
				}
			}
			return true;
		}
		if(exitAreaId == 46 && me.area == 74){ //arcane sant >maji cannon
			if(!NTM_MoveToObject(NTC_UNIT_OBJECT, 357, 357, 0, 0))
				return false;		
			var _unit = NTC_GetUnit(NTC_UNIT_OBJECT, 357); 
			_unit.interact(); 
			_unit.interact(); 
			NTC_Delay(250); 
			me.cancel(1);
			NTC_Delay(600); 
			if(!NTM_UsePortal("Portal", 46))
				return false;
			return true;
		}
		
		for(var n in exit) {
			var target;
			if (exit[n].id)
				target = exit[n].id
			else
				target = exit[n].target
				
			if(target == exitAreaId) {
				var oldArea = me.area;
				NTM_MoveTo(exit[n].x,exit[n].y);
				var TargetID=exit[n].tileid;
				if(goThru) {
					if(exit[n].type == 2) {
						return NTM_takeTile(exit[n].tileid);
					}
				//	if(typeof(getExits) == 'function')
				//		var otherExit = getExits(getArea(exitAreaId));
				//	else	
				//		var otherExit = getArea(exitAreaId).exits;	
					
					//print(otherExit.toSource ());
					//for(var l = 0; l < otherExit.length; l++) {
					//	var otherTarget;
					//	if (otherExit[n].id)
					//		otherTarget = exit[n].id
					//	else
					//		otherTarget = exit[n].target
							
					//	if(otherTarget == oldArea) {
							NTM_EnterArea(exitAreaId);
								if(oldArea == me.area){
									clickMap(0, 0, me.x+5, me.y+5);
									NTC_Delay(300);
									postWalkDelay();
								}
								if(oldArea == me.area){
									NTM_MoveTo(exit[n].x,exit[n].y);
									clickMap(0, 0, me.x-5, me.y+5);
									postWalkDelay();
								}
								if(oldArea == me.area){
									NTM_MoveTo(exit[n].x,exit[n].y);
									clickMap(0, 0, me.x-5, me.y-5);
									postWalkDelay();
								}
								if(oldArea == me.area){
									NTM_MoveTo(exit[n].x,exit[n].y);
									clickMap(0, 0, me.x+5, me.y-5);
									postWalkDelay();
								}
								//retry bigger
								if(oldArea == me.area){
									clickMap(0, 0, me.x+10, me.y+10);
									postWalkDelay();
								}
								if(oldArea == me.area){
									NTM_MoveTo(exit[n].x,exit[n].y);
									clickMap(0, 0, me.x-10, me.y+10);
									postWalkDelay();
								}
								if(oldArea == me.area){
									NTM_MoveTo(exit[n].x,exit[n].y);
									clickMap(0, 0, me.x-10, me.y-10);
									postWalkDelay();
								}
								if(oldArea == me.area){
									NTM_MoveTo(exit[n].x,exit[n].y);
									clickMap(0, 0, me.x+10, me.y-10);
									postWalkDelay();
								}
					//	}
				//	}
				}
				return true;
			}
		}
		return false;
	}

function NTM_takeTile(tileId) {		
			//Obtain the unit for the tile and store old area
			var tileUnit = (arguments.length > 1) ? getUnit(arguments[1], tileId) : getUnit(5, tileId);
			var oldArea = me.area;
			//Insure we have the unit
			
			//Keep trying to go thru the tile until area changes
			var _prearea = me.area;
			for(var i = 0 ; i < 100 ; i++){
				if((i % 25) == 0){
					if(!tileUnit)
						return false;
					//if(NTM_GetCloserInt(tileUnit))
						tileUnit.interact ();
				}
				NTC_Delay(40);
				if(me.area != _prearea)
					break;
			}
				preWalkDelay();
		
		while(me.area == 0)
			NTC_Delay(NTC_DELAY_FRAME);
	
		if(me.area == _prearea)
			return false;

		debugPrint("ntm takeStairsDelay" );
		postWalkDelay();
		NTC_Delay(50);
   	return true;

}

function NTM_GotoWaypoint( pArea ,get,maxDist) {
	print("gotowp");
	var match = false;
	var _wpidarray = [ 119, 145, 156, 157, 237, 238, 288, 323, 324, 398, 402, 429, 494, 496, 511, 539 ];
	var _presetobjects = getPresetUnits( pArea, 2, null, null );	
	if ( _presetobjects.length == 0 ) {	
		return false;
	}
	for ( var i = 0; i < _presetobjects.length; i += 1 ) {
		for ( var j = 0; j < _wpidarray.length; j += 1 ) {
			if ( _presetobjects[i].id == _wpidarray[j] ) {
				if(maxDist && getDistance(me.x,me.y,_presetobjects[i].roomx*5 + _presetobjects[i].x,_presetobjects[i].roomy*5+_presetobjects[i].y) <maxDist){
					NTM_MoveTo(_presetobjects[i].roomx*5 + _presetobjects[i].x,_presetobjects[i].roomy*5+_presetobjects[i].y);				
					match = i;
				}else{
				return false;
				}
				}
		}		
	}
	if(!match)
		return false;
	if (get && match){
		var wp = getUnit(2,_presetobjects[match].id);
		if(wp){
			
			var l=0;
			//print(getUIFlag(0x14));
			while(!getUIFlag(0x14) && l++ < 40){
			NTC_DoClick(0,0,wp);
			delay(100);			
			}
			l=0;
			while(getUIFlag(0x14) && l++ < 40) {
				wp.cancel(0);
				delay(100);
			}
		}else
			return false;
	}
	return true;	
}

function getColl(area,x,y){
		try {
			return getCollision(area,x,y)
		} catch(e) {
		
			return 99;
		}



}

function NTM_EnterArea(id)
{
var exit= getArea(id).exits
var range =10;
for(var a =0; a< exit.length; a++){
	if (exit[a].target == me.area){
		for (var j =range*-1; j< range ; j=j+5){
	// check laspoint walkable then los line
			if (getColl(id,exit[a].x+j,exit[a].y+range) %2 ==0) 
				return NTM_MoveTo( exit[a].x+j,exit[a].y+range)
			
			if (getColl(id,exit[a].x+j,exit[a].y-range) %2 ==0) 
				return NTM_MoveTo( exit[a].x+j,exit[a].y-range)
			
			if (getColl(id,exit[a].x+range,exit[a].y+j) %2 ==0) 
				return NTM_MoveTo( exit[a].x+range,exit[a].y+j)
			
			if (getColl(id,exit[a].x+range,exit[a].y-j) %2 ==0) 
				return NTM_MoveTo( exit[a].x+range,exit[a].y-j)
		}	
	}
}
	
	var _room;
	var _rooms;
	var rx,ry,path,reachable, tempCR,cx,cy
	var closeDist =100000;
	_room = getRoom(id);

	if(!_room)
		return false;

	_rooms = new Array();
		
	do
	{
		rx = parseInt(_room.x*5 + _room.xsize/2);
		ry = parseInt(_room.y*5 + _room.ysize/2)
		//path= getPath(me.area, me.x, me.y, rx, ry,false);
		
		reachable =isRoomReachable(_room);
		if (reachable){	
			_rooms.push([reachable[0],reachable[1]])//[parseInt(_room.x*5 + _room.xsize/2), parseInt(_room.y*5 + _room.ysize/2)]);
			
		}
			
	} while(_room.getNext());

	
		_rooms.sort(NTA_SortRoomInt);
		_room = _rooms.shift();
		//print(_rooms.toSource());		
			NTM_MoveTo(_room[0], _room[1]);	
	
	
	
	return false;
}

// vector class
function vector()
{
	if(arguments.length == 2)
	{
		this.x = arguments[0];
		this.y = arguments[1];
	}
	else if(arguments.length == 1)
	{
		this.x = arguments[0].x;
		this.y = arguments[0].y;
	}
	else
	{
		this.x = 0;
		this.y = 0;
	}
	
	this.rotate = vector_rotate;
	this.normalize = vector_normalize;
	this.length = vector_length;
	this.setlength = vector_setlength;
	this.toString = vector_toString;
	this.set = vector_set;
	this.angle = vector_angle;
}

function vector_rotate(degree)
{
	if(!degree)
		return true;

	var l = this.length();
	if(!l)
		return false;

	this.normalize();

	var rad = degree * (Math.PI/180);

	var nx = this.x * Math.cos(rad) - this.y * Math.sin(rad);
	var ny = this.x * Math.sin(rad) + this.y * Math.cos(rad);

	this.x = nx;
	this.y = ny;

	this.normalize();
	if(l != 1)
		this.setlength(l);

	return true;
}

function vector_angle(v)
{
	var rad_degree = 180 / Math.PI;

	return Math.acos((this.x*v.x) + (this.y*v.y)) * rad_degree;
}

function vector_length()
{
	return Math.sqrt((this.x*this.x) + (this.y*this.y));
}

function vector_setlength(length)
{
	this.normalize();
	this.x *= length;
	this.y *= length;
}

function vector_normalize()
{
	var l = this.length();
	if(!l)
		return false;

	this.x /= l;
	this.y /= l;

	return true;
}

function vector_toString()
{
	str = "(";
	str += Math.round(this.x*1000)/1000;
	str += " , ";
	str += Math.round(this.y*1000)/1000;
	str += ") : ";
	str += Math.round(this.length()*1000)/1000;

	return str;
}

function vector_set(tx, ty)
{
	if(arguments.length == 1)
	{
		this.x = tx.x;
		this.y = tx.y;
	}
	else if(arguments.length == 2)
	{
		this.x = tx;
		this.y = ty;
	}
}

// coord class
function coord()
{
	this.data = null;

	if(arguments.length == 3)
	{
		this.x = arguments[0];
		this.y = arguments[1];
		this.data = arguments[2];
	}
	else if(arguments.length == 2)
	{
		this.x = arguments[0];
		this.y = arguments[1];
	}
	else if(arguments.length == 1)
	{
		this.x = arguments[0].x;
		this.y = arguments[0].y;
	}
	else
	{
		this.x = 0;
		this.y = 0;
	}

	this.dist = coord_dist;
	this.dist2 = coord_dist2;
	this.dir = coord_dir;
	this.move = coord_move;
	this.set = coord_set;
	this.toString = coord_toString;
}

function coord_set(tx, ty, d)
{
	if(arguments.length == 1)
	{
		this.x = tx.x;
		this.y = tx.y;

		if(tx.data)
			this.data = tx.data;
		else
			this.data = null;
	}
	else if(arguments.length == 2)
	{
		this.x = tx;
		this.y = ty;
		this.data = null;
	}
	else if(arguments.length == 3)
	{
		this.x = tx;
		this.y = ty;
		this.data = d;
	}
}

function coord_dist(tx, ty)
{
	if(arguments.length == 1)
	{
		var vx = this.x - tx.x;
		var vy = this.y - tx.y;

		return Math.round(Math.sqrt((vx*vx) + (vy*vy)));	
	}
	else if(arguments.length == 2)
	{
		var vx = this.x - tx;
		var vy = this.y - ty;

		return Math.round(Math.sqrt((vx*vx) + (vy*vy)));
	}
return false;
}

function coord_dist2(tx, ty)
{
	if(arguments.length == 1)
	{
		vx = this.x - tx.x;
		vy = this.y - tx.y;

		return Math.floor((vx*vx) + (vy*vy));
	}
	else if(arguments.length == 2)
	{
		vx = this.x - tx;
		vy = this.y - ty;

		return Math.floor((vx*vx) + (vy*vy));
	}
return false;
}

function coord_dir(tx, ty)
{
	if(arguments.length == 1)
	{
		var v = new vector(tx.x-this.x, tx.y-this.y);
		v.normalize();

		return v;
	}
	else if(arguments.length == 2)
	{
		v = new vector(tx-this.x, ty-this.y);
		v.normalize();

		return v;
	}
return false;
}

function coord_move(vec, d)
{
	if(d)
	{
		this.x += Math.round(vec.x*d);
		this.y += Math.round(vec.y*d);

		return true;
	}
	else if(vec.length())
	{
		this.x += Math.round(vec.x);
		this.y += Math.round(vec.y);

		return true;
	}

	return false;
}

function coord_toString()
{
	return "( " + this.x + " , " + this.y + " ) " + this.data;
}
