script "revDictionaryBehavior"
-- Some browsers have a built-in scrollbar. Add a fudge factor to 
-- take this into account
constant kScrollbarFudge = 18

-- The background colour for the dictionary stack
constant kBackColor = "white"

local sTab, sEntry
on setAsBehavior pTarget
   dispatch "setAsBehavior" to stack revIDEFrameBehavior() with the long id of this me
   set the behavior of pTarget to the long id of this me
end setAsBehavior

on openStack
   lock screen
   --Force the browser to actually resize
   set the rect of widget "Dictionary" of me to 0,0,0,0
   set the title of me to "Dictionary"
   set the backColor of me to kBackColor
   if sTab is empty then
      put "api" into sTab
   end if
   revIDEGenerateDictionaryHTML sTab, sEntry["library"], sEntry["entry"], sEntry["type"]
   put empty into sEntry
   showTab sTab
   --set the cantModify of me to true	
   set the text of button "Libraries" to ideDocsFetchLibraryNames()
   setLibrary "LiveCode Script"
   unlock screen
end openStack

on resizeStack
   lock screen
   local tRect, tBrowserRect, tSearchRect
   put the contentRect of me into tRect
   lock messages
   put tRect into tBrowserRect 
   put tRect into tSearchRect
   
   set the width of button "TopResizer" of me to the width of this card of me
   set the left of button "TopResizer" to 0
   
   set the top of group "TopBar" of me to item 2 of tRect
   
   put the bottom of group "TopBar" of me into item 2 of tSearchRect
   put the top of button "TopResizer" of me into item 4 of tSearchRect
   set the rect of field "Entries" of me to tSearchRect
   
   local tContentTop, tContentLeft
   put the bottom of button "TopResizer" of me into tContentTop 
   put the right of button "Left Resizer" of me into tContentLeft
   
   set the height of button "Left Resizer" of me to the bottom of this card of me - tContentTop
   set the top of button "Left Resizer" of me to tContentTop
   
   put tContentLeft into item 1 of tRect
   put tContentTop into item 2 of tRect
   set the rect of widget "Dictionary" of me to tRect
   unlock messages
   unlock screen
end resizeStack

on showAPIs
   showTab "api"
end showAPIs

on showGuides
   showTab "guide"
end showGuides

on showTab pTab
   hiliteFrameItem pTab
   put pTab into sTab
   revIDEEnsureDictionaryUrl pTab
   local tUrl
   put "file://" & revIDEGetDictionaryUrl(pTab) into tUrl
   replace " " with "%20" in tUrl
   set the url of widget "Dictionary" of me to tUrl
end showTab

on browserNavigateComplete
   if sEntry is not empty then
      do "goEntryName('" & sEntry["library"] & "','" & sEntry["entry"] & "','" & sEntry["type"] & "')" in widget "Dictionary" of me
      put empty into sEntry
   end if
   if the mode of me is not 0 then
      resizeStack
   end if
end browserNavigateComplete

on navigateToEntry pLibrary, pEntry, pType
   put pLibrary into sEntry["library"]
   put pEntry into sEntry["entry"]
   put pType into sEntry["type"]
   if the mode of me is not 0 then
      browserNavigateComplete
   else
      toplevel me
   end if
end navigateToEntry

on navigateToEntryInCurrentLibrary pEntry, pType
   navigateToEntry getLibrary(), pEntry, pType
end navigateToEntryInCurrentLibrary

on paneResized pWhich
   resizeStack
end paneResized

function entryList pLibrary
   local tEntries
   put ideDocsFetchLibraryEntries(pLibrary) into tEntries
   
   local tData, tEntry, tLine
   repeat with x = 1 to the number of elements of tEntries
      put tEntries[x] into tEntry
      put tEntry["display name"] into tLine
      put tab & tEntry["type"] after tLine
      put tab & tEntry["syntax"][1] after tLine
      put tLine & return after tData
   end repeat
   delete the last char of tData
   return tData
end entryList

local sLibrary
command setLibrary pLibrary
   put entryList(pLibrary) into field "Entries" of me
   put empty into field "Search" of me
   put pLibrary into sLibrary
   set the label of button "Libraries" of me to sLibrary
end setLibrary

function getLibrary
   return sLibrary
end getLibrary

private command andRegex pWord, @xRegex
   put "(?=.*" & pWord & ")" after xRegex
end andRegex

function doFilter pToFilter, pFilter
   local tRegex
   repeat for each word tWord in pFilter
      andRegex tWord, tRegex
   end repeat
   
   if tRegex is not empty then
      put tRegex & ".*" into tRegex
      
      filter pToFilter with regex pattern tRegex
   end if
   
   return pToFilter
end doFilter

local sOldFilterText
command updateSearchFilter pNewText
   local tToFilter
   -- Optimise additional text
   if pNewText begins with sOldFilterText then
      put field "Entries" of me into tToFilter
   else
      put entryList(sLibrary) into tToFilter
   end if
   
   put doFilter(tToFilter, field "Search" of me) into field "Entries" of me
   put pNewText into sOldFIlterText
end updateSearchFilter

on linkClicked pEntryName, pEntryType, pLibraryName
   navigateToEntryInCurrentLibrary pEntryName, pEntryType
end linkClicked
