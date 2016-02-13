---
layout: post
title: Inno Setup功能函数合集
date: 2016-01-10 09:11:31
---

1 检测系统是否win7

```pascal
function CheckWin7(): Boolean;
begin
  GetWindowsVersionEx(Version);
  if Version.Major = 6 then
  begin
    Result := True;   
  end else
  begin
      Result := False;
  end;
end;
```
2 检测是否是silent安装

```pascal
function CheckSilentInstall():Boolean;
begin
  if Lowercase(ExpandConstant('{param:conf|n}')) = 'y' then 
  begin
    SilentInstall := 'y';
    Log('silent install');
    Result := True;
  end else
  begin
    SilentInstall := 'n';
    Result := False;
  end;
end;
```
3 检测端口是否被占用

```pascal
function CheckPortOccupied(Port:String):Boolean;
var
  ResultCode: Integer;
begin
 Exec(ExpandConstant('{cmd}'),  '/C netstat -na | findstr'+' /C:":'+Port+' "', '', 0,ewWaitUntilTerminated, ResultCode);
  if ResultCode  <> 1 then 
  begin
    Log('this port('+Port+') is occupied');
    Result := True; 
  end else
  begin
    Result := False;
  end;
end;
```
4 检测无效端口

```pascal
function CheckWrongPort(Port:String):Boolean;
var
  iPort,lMax,lMin:Longint;
begin
  lMax := 65535;
  lMin := 0;
  iPort := StrToIntDef(Port,-1); 
  if  iPort <> -1  then //有效字符
  begin
    if (iPort >= lMin) and (iPort <= lMax) then    
      Result := False    
    else
      Result := True;
  end else 
    Result := True;
end;
```
5 检测有效端口

```pascal
function CheckValidPort(Port:String):Boolean;
var
  iPort,lMax,lMin:Longint;
begin
  lMax := 65535;
  lMin := 1024;
  iPort := StrToIntDef(Port,0);
  if (iPort <=lMax) and (iPort >= lMin) then
    Result := True
  else
    Result := False;
end;
```
6 检测用户是否域用户

```pascal
function CheckDomainUser():Boolean;
var
DosCmd : String;
ResultCode: Integer;
begin
  UserName := ExpandConstant('{username}');
  DomainName := ExpandConstant('{USERDOMAIN}');
  DosCmd := '/C net localgroup Administrators | findstr '+'"'+DomainName+'\'+UserName+'"';
  Exec(ExpandConstant('{cmd}'),DosCmd, '',  SW_HIDE,ewWaitUntilTerminated, ResultCode);
  if ResultCode = 0 then
  begin
    Result := True
    Log('this user('+UserName+') is a domain user');
  end else
    Result := False;
end;
```
7 修改环境变量

```pascal
procedure SetEnv(aEnvName, aEnvValue: string; aIsInstall, aIsInsForAllUser: Boolean);
begin
  if aIsInstall then
  begin
    if not RegWriteStringValue(HKEY_LOCAL_MACHINE, 'SYSTEM\CurrentControlSet\Control\Session Manager\Environment', aEnvName, aEnvValue) then
      Log('set env:'+aEnvName+' fail');
  end;
  if not aIsInstall then
  begin
    RegDeleteValue(HKEY_LOCAL_MACHINE, 'SYSTEM\CurrentControlSet\Control\Session Manager\Environment', aEnvName);
  end; 
end;
```
8 检测中文安装路径

```pascal
function CheckChinesePath(Ch: Char): Boolean;
var
  i:Integer;
begin
  i:=Ord(Ch);
  if (i>=127) then
    Result := False 
  else 
    Result := True;
end;
```
9 修改配置文件

```pascal
procedure ModConf(FileName,OldString,NewString:string);
var
  FileLines: TArrayOfString;
  i: Integer;
begin
  LoadStringsFromFile(FileName, FileLines); 
  for i:=0 to GetArrayLength(FileLines)-1 do 
  if (Pos(OldString, FileLines[i]) > 0) then 
  StringChange(FileLines[i], OldString, NewString); 
  SaveStringsToFile(FileName, FileLines, False); 
end;
```