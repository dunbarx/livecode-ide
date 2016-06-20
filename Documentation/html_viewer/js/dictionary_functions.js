	var tState = {selected:"",history:[],searched:{},filters:{},filtered_data:{},data:"",selected_api_id:""};
	
	if($.session.get("selected_api_id")) tState.selected = $.session.get("selected_api_id");
	
	if($.session.get("selected")) tState.selected = $.session.get("selected");
	else tState.selected = 1;

	
	var sFilters = {type:"",tag:"",os:""};
	
	function dataGet(){
		//console.log(dictionary_data.docs);
		
		if(!dictionary_data.docs.hasOwnProperty(tState.selected_api_id)){
			
			$.each(dictionary_data.docs, function(index, libraryData){
				tState.selected_api_id = index;
				return false;
			});
		}
		
		if(tState.dirtyData == true || tState.data == ""){
			tState.data = dictionary_data.docs[tState.selected_api_id].doc.sort(compareEntryObject);
			tState.dirtyData = false;
		}
		
		return tState.data;
	}
	
	function dataSearch(pTerm){
		if(tState.searched.hasOwnProperty("term") && tState.searched.term == pTerm) return tState.searched.data;
		tState.searched.term = pTerm;
		
   		var tokensOfTerm = pTerm.match(/\S+/g);

    	var matchExp = "";
    	$.each(tokensOfTerm, function(index, matchToken){
       		matchExp += "(?=.*" + matchToken + ")"
   		});

		var regex = new RegExp(matchExp,"i");
		
		tState.searched.data = $.grep(tState.filtered_data, function (e) {
			//console.log(e);
			return regex.test(e["display syntax"][0]);
		});
		
		return tState.searched.data;
	}
	
	function dataFilter(){
		var filtered_data = [];
		var tFound_data = []
		
		if(jQuery.isEmptyObject(tState.filters) == true){
		 	tState.filtered_data = dataGet();
		} else {		
			$.each(dataGet(), function(index, entryData){
				$.each(tState.filters, function(category, values){
					tFound_data[category] = 0;
					$.each(values, function(tag, tag_value){
					
						switch(category){
							case "type":
								if(entryData[category] == tag_value){
									tFound_data[category]++;
								 }
								break;
							case "platforms":
							case "OS":
							case "tags":
								if(entryData.hasOwnProperty(category)){
									$.each(entryData[category], function(item_index, entry_item_value){
										if(tag_value == entry_item_value){
											tFound_data[category]++;
										}
									});
								}
								break;
						}
					});
				});
			
				var tMatch = true;
				$.each(tState.filters, function(category, values){
					if(tFound_data[category] == 0){
						tMatch = false;
					}
				});
			
				if(tMatch == true) filtered_data.push(entryData);
			});
			
			tState.filtered_data = filtered_data;
		}
		displayFilters();
		
		tState.searched = {};
		displayEntryListGrep($("#ui_filer").val());	
	}
	
	function compareEntryObject(entryObject1,entryObject2) {
		if(entryObject1["display syntax"][0].toLowerCase() < entryObject2["display syntax"][0].toLowerCase())
			return -1;
		if (entryObject1["display syntax"][0].toLowerCase() > entryObject2["display syntax"][0].toLowerCase())
			return 1;
		return 0;
	}


	function filterOptions(pCategories){
		var tFilterOptionWithCount = {}
		var tShowCatogories = pCategories.split(',');
		$.each(tShowCatogories, function( index, category_name) {
			tFilterOptionWithCount[category_name] = {}
		});
		
		$.each(tState.filtered_data, function( entry_index, entry_data) {
			$.each(tShowCatogories, function( category_index, category_name) {
				// If the category is already being filtered on then don't count
				if(!tState.filters.hasOwnProperty(category_name)){
					if(entry_data[category_name]){
						var tTagData = entry_data[category_name];
		
						if(Array.isArray(tTagData)){
							// Data is an array meaning there are multiple values. I.e. multiple tags / platforms to check.
							$.each(tTagData, function( tag, tag_value) {
								if(tFilterOptionWithCount[category_name].hasOwnProperty(tag_value)){
									tFilterOptionWithCount[category_name][tag_value]++;
								} else {
									tFilterOptionWithCount[category_name][tag_value] = 1;
								}
							});
						} else {
							if(tFilterOptionWithCount[category_name].hasOwnProperty(tTagData)){
								tFilterOptionWithCount[category_name][tTagData]++;
							} else {
								tFilterOptionWithCount[category_name][tTagData] = 1;
							}
						}
					}
				}
			});
		});
		return tFilterOptionWithCount;
	}
	
	function filter_remove(pTag,pData){
		if(tState.filters.hasOwnProperty(pTag)){
			$.each(tState.filters[pTag], function(index, data) {
				if(data==pData){
					tState.filters[pTag].splice(index, 1)
					if(tState.filters[pTag].length == 0){
						delete tState.filters[pTag];
					}
					return false;
				}
			});
		}
		dataFilter();
	}
	
	function filter_add(pTag,pData){
		if(!tState.filters.hasOwnProperty(pTag)) tState.filters[pTag] = [];
		
		if(tState.filters[pTag].indexOf(pData) == -1){
			tState.filters[pTag].push(pData);
			dataFilter();
		}
	}
	
	function sortedKeys(obj)
	{
		return Object.keys(obj).sort();
	}
	
	function setFilter(pKey, pValue)
	{
		sFilters[pKey] = pValue;
	}
	
	function filterEntries(pBase, pKey, pValue)
	{
		var tData;
		tData = [];
		console.log(pBase);
		$.each(pBase,function(entry_index, entry_data)
		{
			if (entry_data.hasOwnProperty(pKey))
			{
				if (entry_data[pKey] instanceof Array)
				{
					console.log(entry_data[pKey]);
					console.log(pValue);
					if (entry_data[pKey].indexOf(pValue) >= 0)
					{
						tData.push(entry_data);
					}
				}
				else
				{
					if (entry_data[pKey] == pValue)
					{
						tData.push(entry_data);
					}
				}
			}
		});
		console.log(tData);
		return tData;
	}
		
	function link_html(pType, pOSArray)
	{
		var tHtml = '';
		$.each(pOSArray,function(entry_index, entry_data)
		{	
			if (tHtml != '')
				tHtml += ',';
			tHtml += click_text(entry_data, entry_data, pType, '');
		});
		return tHtml;
	}

	function filteredContent()
	{
		var tData = dataGet();
		var tHTML = '<p>Entries';
		
		if (sFilters.tag != '')
		{
			tData = filterEntries(tData, "tags", sFilters.tag);
			tHTML += ' tagged ' + sFilters.tag;
		}
		if (sFilters.os != '')
		{
			tData = filterEntries(tData, "OS", sFilters.os)
			tHTML += ' for ' + sFilters.os;
		}
		if (sFilters.type != '')
		{
			tData = filterEntries(tData, "type", sFilters.type)
			tHTML += ' with type ' + sFilters.type;
		}
		tHTML += ':</p>';
		
		// Sort by type
		var tSortedData;
		tSortedData = {};
		$.each(tData,function(entry_index, entry_data)
		{
			if(!tSortedData.hasOwnProperty(entry_data.type))
			{
				tSortedData[entry_data.type] = [];
			}
			tSortedData[entry_data.type].push(entry_data);
		});
		
		
		tHTML += '<div class="col-md-1 lcdoc_section_title"></div><div class="col-md-11" style="margin-bottom:10px">';
		tHTML += '<table class="lcdoc_glossary_table">';
		var tHead = '<thead><tr>';
		var tBody = '<tbody>';
		var tHeaders = [];
		var tCheckHeaders = true;
		$.each(tSortedData,function(item_type, item_data)
		{
			$.each(item_data,function(item_index, entry_data){
				tBody += '<tr>';
				tBody += '<td>' + click_text_from_entry_data('', entry_data) +'</a></td>';
				
				if (tCheckHeaders)
					tHeaders . push("Name");

				if (sFilters.type == '')
				{
					tBody += '<td>';
					if (tCheckHeaders)
						tHeaders . push("Type");
					tBody += click_text(item_type, item_type, "type", '');
					tBody += '</td>';
				}
				
				if (tCheckHeaders)
					tHeaders . push("Summary");
				tBody += '<td>'+replace_link_placeholders_with_param(entry_data.summary)+'</td>';
				
				if (entry_data.hasOwnProperty("syntax"))
				{
					tBody += '<td>';
					if (tCheckHeaders)
						tHeaders . push("Syntax");
					tBody += replace_link_placeholders_with_param(entry_data.syntax[0]);
					tBody += '</td>';
				}

				if (sFilters.os == '' && entry_data.hasOwnProperty("OS"))
				{
					tBody += '<td>';	
					if (tCheckHeaders)
						tHeaders . push("OS");
					tBody += link_html("os", entry_data.OS);
					tBody += '</td>';
				}
				
				if (sFilters.tags == '' && entry_data.hasOwnProperty("tags"))
				{
					tBody += '<td>';
					if (tCheckHeaders)
						tHeaders . push("Tags");
					tBody += link_html("tag", entry_data.tags);
					tBody += '</td>';
				}
				tBody += '</tr>';
				
				tCheckHeaders = false;
			});
		});
		
		tBody += '</tbody>';
		$.each(tHeaders,function(header_index, header_name)
		{
			tHead += '<td>' + header_name + '</td>';
		});
		
		tHead += '</tr></thead>';
		tHTML += tHead + tBody + '</table></div>';
		return tHTML;
	}
	
	function displayFilters(){
		// First display the applied filters
		var tHTML = "";
		$.each(tState.filters, function(filter_tag, filter_data) {
			tHTML += '<div style="margin-bottom:10px">';
			tHTML += '<b>'+filter_tag+':</b> ';
			$.each(filter_data, function(index, filter_name) {
				tHTML += '<button type="button" class="btn btn-default btn-sm remove_filter" filter_tag="'+filter_tag+'" filter_data="'+filter_name+'">'+filter_name+'</button>';
			});
			tHTML += '</div>';
		});
		$("#filters").html(tHTML);
		
		// Next display the filter options
		tHTML = "";
		var tFilterData = filterOptions("type,tags,OS");
		
		$.each(tFilterData, function(category, value) {
			if(jQuery.isEmptyObject(value) == false){
				tHTML += '<div style="margin-bottom:20px">';
				tHTML += '<b>'+category+':</b> ';
				
				var tSortedFilters = sortedKeys(value);
				for (index = 0; index < tSortedFilters.length; ++index)
				{
					var tFilter = tSortedFilters[index];
					if(tState.filters.hasOwnProperty(index) && tState.filters[category].indexOf(tFilter) > 0){
				
					} else {
						tHTML += '<a href="#" class="apply_filter" filter_category="'+category+'" filter_value="'+tFilter+'">'+tFilter+' <span class="badge">'+value[tFilter]+'</span></a> ';
					}
				}
				tHTML += '</div>';
			}
		});
	
		$("#filters_options").html(tHTML);
	}
	
	function displayEntryListGrep(pTerm){
		var start = new Date().getTime();
		var tHTML = "";
		var resultSet = "";
		
		if(pTerm){
			resultSet = dataSearch(pTerm);
			
			var x = 1;
			$.each(resultSet, function( index, value) {
				//if(x > 100) return false;
				x++;
				
				if(tState.selected == value.id) tClass = " active";
				else tClass = "";
				tHTML += '<tr class="entry_list_item load_entry'+tClass+'" entryid="'+value["id"]+'" id="entry_list_item_'+value["id"]+'">';
				if(value.hasOwnProperty("display syntax") && value["display syntax"][0] != value["display name"]){
					tHTML += '<td>'+value["display syntax"][0]+'</td>';
				} else {
					tHTML += '<td>'+value["display name"]+'</td>';
				}
				tHTML += '</tr>';
				
			});
		} else {
			resultSet = tState.filtered_data;
			var x = 1;
			$.each(resultSet, function( index, value) {
				//if(x > 100) return false;
				x++;
				
				if(tState.selected == value.id) tClass = " active";
				else tClass = "";
				tHTML += '<tr class="entry_list_item load_entry'+tClass+'" entryid="'+value["id"]+'" id="entry_list_item_'+value["id"]+'">';
				if(value.hasOwnProperty("display syntax") && value["display syntax"][0] != value["display name"]){
					tHTML += '<td>'+value["display syntax"][0]+'</td>';
				} else {
					tHTML += '<td>'+value["display name"]+'</td>';
				}
				tHTML += '</tr>';
				
			});
		}
		
		$("#list").html(tHTML);
		$("#entries_showing").html(resultSet.length);
		$("#entries_total").html(dataGet().length);
	}
	
	function displayLibraryChooser(){
		var tHTML = ""
		$.each(dictionary_data.docs, function(index, libraryData){
			if(index == tState.selected_api_id) tHTML += '<li role="presentation"><a role="menuitem" tabindex="-1" href="#" library_id="'+index+'" class="active">'+libraryData["display name"]+'</a></li>';
			else tHTML += '<li role="presentation"><a role="menuitem" tabindex="-1" href="#" library_id="'+index+'">'+libraryData["display name"]+'</a></li>';
		});
	
		$("#lcdoc_library_chooser_list").html(tHTML);
	}
	
	function formatMarkdown(pEntryObject, pContent)
	{
		var tMarkdown = pContent;
		if(pEntryObject.parameters){
			$.each(pEntryObject.parameters, function(index, value) {
				tMarkdown = tMarkdown.replace('<'+value.name+'>', '*'+value.name+'*');	
			});
		}

		if(pEntryObject.synonyms){
			$.each(pEntryObject.synonyms, function(index, value) {
				tMarkdown = tMarkdown.replace('<'+value+'>', '*'+value+'*');	
			});
		}
	
		tMarkdown = replace_link_placeholders_with_links(tMarkdown,pEntryObject);
		
		var renderer = new marked.Renderer();
		renderer.table = function(header, body) 
		{
			var tTable;
			tTable = '<div class="table-responsive"><table class="table table-bordered">\n';
			tTable += '<thead>' + header + '</thead>\n';
			tTable += '<tbody>' + body + '</tbody>\n';
			tTable += '</table></div>';
			
			return tTable;
		}
		
		return marked(tMarkdown, { renderer: renderer });
	}
	
	function dictionaryLanding()
	{
		var tTags = [];
		$.each(dataGet(), function(index, value)
		{
			if (value.type == "tag")
				tTags.push(value);
		});
		
		var tHtml = '<ul>';
		$.each(tTags, function(index, value)
		{
			tHtml += '<li>';
			tHtml += click_text(value.name, value.name, value.type, '');
			tHtml += ' - ';
			tHtml += value.summary;
			tHtml += '</li>';
		});
		tHtml += '</ul>';
		return tHtml;
	}
	
	function displayEntry(pEntryID){	
		var tEntryObject = entryIDToData(pEntryID);
		pEntryID = tEntryObject.id;
		
		console.log(tEntryObject);
		
		if(tState.selected == pEntryID) return 1;
		tState.selected = pEntryID;
		$.session.set("selected", pEntryID);
		
		breadcrumb_draw();
		
		$(".entry_list_item").removeClass("active");
		$("#entry_list_item_"+pEntryID).addClass("active");
		selectedEntryEnsureInView(tEntryObject.id);

		var tHTML = "";
		var references = [];
		tHTML += '<h1 style="margin:0px 0px 30px 12px">'+tEntryObject["display name"]+'</h1><div class="row">';
		$.each(tEntryObject, function(index, value) {
			if(index == "id" || index == "name") return;
			
			switch(index){
				case "examples":
					tHTML += '<div class="col-md-2 lcdoc_section_title">'+index+'</div><div class="col-md-10" style="margin-bottom:10px">';	
					if($.isArray(value)){
						$.each(value, function(index2, value2) {
							tHTML += '<pre><code>' + value2.script + '</code></pre>';
						});
					} else {
						tHTML += 'Malformed examples in JSON';	
					}
					tHTML += '</div>';	
					break;
				case "parameters":
				case "value":
					if($.isArray(value)){
						
						tHTML += '<div class="col-md-2 lcdoc_section_title">'+index+'</div><div class="col-md-10" style="margin-bottom:10px">';
						tHTML += '<div class="table-responsive"><table class="table table-bordered">';
						tHTML += '<thead><tr><th>Name</th><th>Type</th><th>Description</th></tr></thead><tbody>';
						$.each(value, function(index2, value2) {
							switch(value2.type){
								case "array":
									value2.description = replace_link_placeholders_with_links(value2.description, tEntryObject);
									tHTML += '<tr><td class="lcdoc_entry_param">'+value2.name+'</td><td>'+value2.type+'</td><td>'+parameterFormatValue("array", value2)+'</td></tr>';
									break;
								case "enum":
									value2.description = replace_link_placeholders_with_links(value2.description, tEntryObject);
									tHTML += '<tr><td class="lcdoc_entry_param">'+value2.name+'</td><td>'+value2.type+'</td><td>'+parameterFormatValue("enum", value2)+'</td></tr>';
									break;
								default:
									tHTML += '<tr><td class="lcdoc_entry_param">'+value2.name+'</td>';
									tHTML += '<td>'+replace_link_placeholders_with_links(value2.type,tEntryObject)+'</td>';
									tHTML += '<td><div class="lcdoc_description">'+ formatMarkdown(tEntryObject, value2.description)+'</div></td></tr>';
									break;
							}
						});
						tHTML += '</tbody></table></div>';
						tHTML += '</div>';
					} else {
						tHTML += 'Malformed parameters in JSON';	
					}
					
					break;
				case "references":
					tHTML += '<div class="col-md-2 lcdoc_section_title">Related</div><div class="col-md-10" style="margin-bottom:10px">';
					
					$.each(value, function(reference_type, reference_array) {
						tHTML += reference_type + ':';
						var reference_html = "";
						$.each(reference_array, function(reference_index, reference_name) {
							var tReference;
							if (entryNameToID(reference_name, reference_type) == 0)
								tReference = reference_name;
							else
								tReference = click_text(reference_name, reference_name, reference_type, '');
							
							if (reference_html == "") 
								reference_html = tReference;
							else 
								reference_html += ',' + tReference;
						});
						tHTML += reference_html;
						tHTML += '<br />';
					});
				
					tHTML += '</div>';
				
					break;
				case "syntax":
					var tSyntaxHTML = "";
					tHTML += '<div class="col-md-2 lcdoc_section_title">'+index+'</div><div class="col-md-10" style="margin-bottom:10px">';	
					if($.isArray(value)){
						$.each(value, function(index2, value2) {
							tSyntaxHTML += replace_link_placeholders_with_param(value2);
							// Syntax can be multi-line
							tSyntaxHTML = tSyntaxHTML.replace(/\n/g, "<br />")
							tSyntaxHTML += '<br />';
						});
					} else {
						tSyntaxHTML += 'Malformed syntax in JSON';	
					}
					tHTML += tSyntaxHTML;
					tHTML += '</div>';
					break;
				case "associations":
					if($.isArray(value)){
						tHTML += '<div class="col-md-2 lcdoc_section_title">'+index+'</div><div class="col-md-10" style="margin-bottom:10px">';
						var association_html = "";
						$.each(value, function(index2, value2) {
							var tTypes, tType;
							tTypes = ["object","library","glossary"];
							
							var tData;
							$.each(tTypes, function(tTypeIndex, tType) {
								tData = entryData(value2, tType)
								if (tData != {})
									return;
							});
							
							var tAssociation;
							if (tData == {})
								tAssociation = value2;
							else
								tAssociation = click_text_from_entry_data('', tData);
							
							if (association_html == "") 
								association_html = tAssociation;
							else 
								association_html += ',' + tAssociation;
						});
						tHTML += association_html + '</div>';
					}
					break;
				case "summary":
					tHTML += '<div class="col-md-2 lcdoc_section_title">'+index+'</div><div class="col-md-10" style="margin-bottom:10px">';
					//tHTML += '<span class="social social-ios"></span>';
					tHTML += replace_link_placeholders_with_links(value,tEntryObject);
					tHTML += '</div>';
					break;	
				case "description":
				case "security":
				case "tags":
				case "display name":
				case "display syntax":
					break;
					
				
					
				default:
					
					tHTML += '<div class="col-md-2 lcdoc_section_title">'+index+'</div><div class="col-md-10" style="margin-bottom:10px">';
					//tHTML += '<span class="social social-ios"></span>';
					tHTML += value;
					tHTML += '</div>';
					break;
			}
		});
		
		
		if(tEntryObject.description){
			// Italicise any parameters
			tHTML += '<div class="col-md-2 lcdoc_section_title">description</div><div class="col-md-10 lcdoc_description" style="margin-bottom:10px">';
			tHTML += formatMarkdown(tEntryObject, tEntryObject.description);
			tHTML += '</div>';
		}

		// Now that the entry has been displayed we need to look at the type
		// If it is object, we need to generate a list of actions / events and properties
		// That can be set on the object. The entry if you like should be a pointer to 
		// Everything associated with the object. A cross between a overview and userguide
		
		if(tEntryObject.type == "object" || tEntryObject.type == "widget" || tEntryObject.type == "library"){
			var object_name = tEntryObject["display name"].toLowerCase();
			var object_data = {};
			
			$.each(dataGet(),function(entry_index, entry_data){
				if(entry_data.hasOwnProperty("associations")){
					if(entry_data["associations"].indexOf(object_name) >= 0){
						if(!object_data.hasOwnProperty(entry_data.type)){
							object_data[entry_data.type] = [];
						}
						object_data[entry_data.type].push(entry_data);
					}
				}
			});
			
			$.each(object_data,function(item_type, item_data){
				tHTML += '<div class="col-md-1 lcdoc_section_title">'+item_type+'</div><div class="col-md-11" style="margin-bottom:10px">';
				tHTML += '<table class="lcdoc_glossary_table">';
				tHTML += '<thead><tr><td><b>Name</b></td><td><b>Summary</b></td><td><b>Syntax</b></td></tr></thead><tbody>';
				$.each(item_data,function(item_intex, entry_data){
					tHTML += '<tr>';
					tHTML += '<td>' + click_text_from_entry_data('', entry_data) +'</a></td>';
					tHTML += '<td>'+replace_link_placeholders_with_param(entry_data.summary)+'</td>';
					tHTML += '<td>'+replace_link_placeholders_with_param(entry_data.syntax[0])+'</td>';
					tHTML += '</tr>';
				});
				tHTML += '</tbody></table>';
				tHTML += '</div>';
			});
			//console.log(object_data);
		}
		else if (tEntryObject.type == "type" || tEntryObject.type == "tag" || tEntryObject.type == "os")
		{
			tHTML += filteredContent();
		}
		else if (tEntryObject.type == "dictionary")
		{
			tHTML += dictionaryLanding();
		}
		tHTML += '</div>';
		
		$("#api_entry").html(tHTML);
		$('pre code').each(function(i, block) {
    		hljs.highlightBlock(block);
 		});		
 		
 		// Force code not detected as LCB to be highlighted as LCS
 		$(".hljs:not(.livecodebuilder)").each(function(i, block) {
 			$(this).addClass("livecode");
    		hljs.highlightBlock(block);
 		});
		window.scrollTo(0, 0);
	}
	
	function replace_link_placeholders_with_param(pText){
		if(pText){
			var pText = pText.replace(/<([^>]*)>/igm, function(matched_whole, matched_text) {
				var resolved = resolve_link_placeholder(matched_text);
				return '<span class="lcdoc_entry_param">' + resolved[0] + '</span>';	
			});
			return pText;
		}
	}	
				
	
	function replace_link_placeholders_with_links(pText, pEntryObject){
		if(pText && pEntryObject){
			var pText = pText.replace(/<([^>]*)>/igm, function(matched_whole, matched_text) {
				var return_text = matched_whole;
				
				if(pEntryObject.hasOwnProperty("display name")) {
					if(pEntryObject["display name"] != "" && matched_text == pEntryObject["display name"]){
						return_text =  '<span class="lcdoc_entry_name">' + pEntryObject["display name"] + '</span>';
					}
				}
				
				if(pEntryObject.hasOwnProperty("synonyms")) {
					$.each(pEntryObject.synonyms, function( index, value) {
						if (value == matched_text)
						 	return_text =  '<span class="lcdoc_entry_name">' + matched_text + '</span>';
				 	});
				} 
				
				if(pEntryObject.hasOwnProperty("parameters")) {
					$.each(pEntryObject.parameters, function(index, parameter_object) {
						if(parameter_object.name == matched_text){
							return_text = '<span class="lcdoc_entry_param">' + parameter_object.name + '</span>';
						} 
					});
             	}
             	
             	if(return_text == matched_whole){
             		var resolved = resolve_link_placeholder(matched_text);
             		
             		var resolved_object = resolve_link_object(pEntryObject, resolved[1], resolved[2]);
             		
             		if (resolved_object.length != 0)
             	   		return_text = click_text_from_entry_data(resolved[0], resolved_object)
             		else
             			return_text = resolved[0];
             	}
             	
             	
				if(return_text == matched_text){
					return matched_whole;
                }
             	return return_text;
         	});
		}
		return pText;
	}
	
	function click_text_from_entry_data(pLink, pEntryData)
	{
		if (pLink == '')
			return click_text(pEntryData["display name"], pEntryData.name, pEntryData.type, '');
		else
			return click_text(pLink, pEntryData.name, pEntryData.type, '');
	}
	
	function click_text(pText, pLinkName, pLinkType, pLinkLibrary)
	{
		var text;
		text = '<a href="javascript:void(0)" class="load_entry" ';
		text += 'entryName="'+pLinkName+'" '; 
		text += 'entryType="'+pLinkType+'" '; 
		text += 'entryLibrary="'+pLinkLibrary+'" '; 
		text += '>' + pText + '</a>';
		return text;
	}
	
	// Returns an array with the label, the reference name and optional reference type.
	function resolve_link_placeholder(pText) {
		var return_array = new Array();
		var matched_text = pText.split("|");	
             		
        if (matched_text[1])
        	return_array[0] = matched_text[1]
                      		
        // Find the entry ID for the given string
        var regex = /([^\(]*)(?:\((.*)\))?/;

		var result = regex.exec(matched_text[0]);
		
		if (!matched_text[1])
			return_array[0] = result[1];
		
		return_array[1] = result[1];
        return_array[2] = result[2];
     	return return_array;   
	}
	
	
	// Return an entry ID from the target name and optional type
	function resolve_link(pEntryObject, pTargetName, pTargetType) {
        var entry_id;
        if(pTargetType){
	        // Know name and type so lookup id
             entry_id = entryNameToID(pTargetName,pTargetType);
        } else {
        	// Work out the type from the reference
			if(pEntryObject.hasOwnProperty("references")) {
				$.each(pEntryObject.references,  function(reference_type, reference_array) {
					$.each(reference_array, function(reference_index, reference_name) {
						if (reference_name == pTargetName)
						{
							entry_id = entryNameToID(reference_name,reference_type);
							return;
						}
					});
					// Just find the first one if no type was specified.
					if (entry_id)
						return;
				});
			}
        }
	        
	    return entry_id;
	}
	
	// Return an entry ID from the target name and optional type
	function resolve_link_object(pEntryObject, pTargetName, pTargetType) {
        var entry_type = pTargetType;
        
        if (pTargetType == '')
        {
        	// Work out the type from the reference
			if (pEntryObject.hasOwnProperty("references")) 
			{
				$.each(pEntryObject.references,  function(reference_type, reference_array) 
				{
					$.each(reference_array, function(reference_index, reference_name) 
					{
						if (reference_name == pTargetName)
						{
							entry_type = reference_type;
							return;
						}
					});
					
					if (entry_type != '')
						return;
				});
			}
        }
	    if (entry_type != '')    
		    return entryData(pTargetName,entry_type);
		    
		return [];
	}
	
	function entryData(pEntryName, pEntryType)
	{
		var tData = [];
	
		$.each(dataGet(), function(index, value) 
		{
			if (value.type == pEntryType &&
				(value.name == pEntryName || value["display name"] == pEntryName))
			{
				tData = value;
				return;
			}
		});
		
		return tData;
	}

	function entryIDToData(pID)
	{
		var tData = [];
	
		$.each(dataGet(), function(index, value) 
		{
			if(value.id == pID)
			{
				tData = value;
				return;
			}
		});
		
		return tData;
	}

	function entryNameToID(pName,pType){
		var tID = 0;
		var tEntryData;
		tEntryData = entryData(pName, pType);
		
		if (tEntryData.length != 0)
			tID = tEntryData.id;
	
		return tID;
	}
	
	function entryIDToArrayKey(pID){
		var tID = 0;
		$.each(dataGet(), function( index, value) {
			if(value.id == pID){
				tID = index;
				return false;
			}
			
		});
		return tID;
	} 
	
	function breadcrumb_draw(){
		var tHistory = tState.history;
		var tHTML = "";
		var tSelectedKey = entryIDToHistoryKey(tState.selected);
		
		//console.log(tState.history);
		if (typeof tSelectedKey == 'undefined') tSelectedKey = 0;
		
		var start_point = 0;
		
		if(tSelectedKey < 2){
			start_point = 0;
		} else {
			start_point = tSelectedKey-2;
		}
		
		end_point = start_point + 4;
		if(end_point > tHistory.length) end_point = tHistory.length;
		
		
		
		//console.log(start_point,end_point);
		
		$.each(tHistory, function(index, value) {
			if(index >= start_point && index <= end_point){
				if(index == tSelectedKey) tHTML = '<li class="active"><a href="#">'+value.name+'</a></li>' + tHTML;
				else tHTML = '<li><a href="javascript:void(0)" class="load_breadcrumb_entry" entryid ="'+value.id+'">'+value.name+'</a></li>' + tHTML;
			}
		});
		
		if(tSelectedKey==tHistory.length-1) tHTML = '<li class="disabled" style="float:left"><a href="#"><span aria-hidden="true">&laquo;</span><span class="sr-only">Previous</span></a></li>' + tHTML;
		else tHTML = '<li class="lcdoc_history_back"><a href="#"><span aria-hidden="true">&laquo;</span><span class="sr-only">Previous</span></a></li>' + tHTML; 
		
		if(tSelectedKey==0) tHTML += '<li class="disabled"><a href="#"><span aria-hidden="true">&raquo;</span><span class="sr-only">Next</span></a>';
		else tHTML += '<li class="lcdoc_history_forward"><a href="#"><span aria-hidden="true">&raquo;</span><span class="sr-only">Next</span></a>';
		$("#breadcrumb").html(tHTML);
		//console.log(tHistory);
		
	}
	
	function parameterFormatValue(pType, pData){
		var tHTML = "";
		tHTML += "<p>" + pData.description + "</p>";
		
		switch(pType){
			case "enum":
				if(pData.hasOwnProperty("enum")){
				   tHTML += "<p>One of the following items:</p><ul>";
				   $.each(pData.enum, function(index, value) {
					   tHTML += '<li><span class="lcdoc_parameterValue">' + value.value + '</span> - ' + value.description + '</li>';
				   });
				   tHTML += "</ul>";
				}
				break;
			case "array":
				if(pData.hasOwnProperty("description")){
					tHTML += "<p>"+pData.description+"</p>";
				}
				break;
		}

		return tHTML;
	}
	
	function history_add(pEntryID){
		//console.log(pEntryID);
		var tEntryObject = entryData(pEntryID);
		$.each(tState.history, function(history_index, history_entry_object) {
			if(history_entry_object.id == pEntryID){
				// History already contains this entry.
				//delete tState.history[history_index];
				tState.history.splice(history_index,1);
				return false;
			}
		});
	
		var tObject = {"id":pEntryID,"name":tEntryObject["display name"]}
		tState.history.unshift(tObject);
	}
	
	function entryIDToHistoryKey(pEntryID){
		var tID = 0;
		$.each(tState.history, function( index, value) {
			if(value.id == pEntryID){
				tID = index;
				return false;
			}
			
		});
		return tID;
	}
	
	function history_back(){
		displayEntry(tState.history[entryIDToHistoryKey(tState.selected)+1].id);
	}
	
	function history_forward(){
		displayEntry(tState.history[entryIDToHistoryKey(tState.selected)-1].id);
	}
	
	function entry_next(){
		var tSelectedID = tState.selected;
		var tNextID = tSelectedID;
		
		$.each(tState.filtered_data, function( index, value) {
			if(value.id == tSelectedID){
				if(tState.filtered_data[index+1]){
					tNextID = tState.filtered_data[index+1].id;
				}
			}
			
		});
		history_add(tNextID);
		displayEntry(tNextID);
	}
	
	function library_set(pLibraryID){
		var tLibraryName = library_id_to_name(pLibraryID);
		$("#lcdoc_library_chooser_text").html(tLibraryName);
	
		if(dictionary_data.docs.hasOwnProperty(pLibraryID))
		{				
			if (tState.selected_api_id != pLibraryID)
			{
				tState.selected_api_id = pLibraryID;
				$.session.set("selected_api_id", pLibraryID);
				tState.selected = ""
				tState.history = [];
				tState.searched = {};
				tState.filters= {};
				tState.filtered_data = {};
				tState.data = "";
			
				dataFilter();
				displayEntry(1);
			}
		}
	}
	
	function library_id_to_name(pID){
		if(dictionary_data.docs.hasOwnProperty(pID)){
			return dictionary_data.docs[pID]["display name"];
		}
	}
	
	function library_name_to_id(pName){	
		var tID = 0;
		$.each(dictionary_data.docs, function(index, value) {
			if((value.name == pName || value["display name"] == pName)){
				tID = index;
				return false;
			}
			
		});
		return tID;
	}
	
	function entry_previous(){
		var tSelectedID = tState.selected;
		var tPreviousID = tSelectedID;
		
		$.each(tState.filtered_data, function( index, value) {
			if(value.id == tSelectedID){
				if(index > 0){
					tPreviousID = tState.filtered_data[index-1].id;
				}
			}
			
		});
		history_add(tPreviousID);
		displayEntry(tPreviousID);
	}
	
	function selectedEntryEnsureInView(tEntryID)
	{

	} 
	
	function goEntryName(pLibraryName, pEntryName, pEntryType)
	{
		var tLibraryID = library_name_to_id(pLibraryName);
		library_set(tLibraryID);
		
		var tID = entryNameToID(pEntryName, pEntryType);
		if (tID == 0)
			tID = 1;
		displayEntry(tID);
	}
	
	function setActions()
	{
		$('#ui_filer').keyup(function() {
		  displayEntryListGrep(this.value);
		})
		
		$("body").on( "click", ".load_entry", function() {
			var tEntryName, tEntryType, tEntryLibrary;
			tEntryName = $(this).attr("entryName");
			tEntryType = $(this).attr("entryType");
			tEntryLibrary = $(this).attr("entryLibrary");
			if (typeof(liveCode) != 'undefined')
				liveCode.linkClicked(tEntryName, tEntryType, tEntryLibrary);
			else
				displayEntry(entryNameToID(tEntryName, tEntryType));	
		});
		
		$("body").on( "click", ".load_breadcrumb_entry", function() {
			displayEntry($(this).attr("entryid"));
		});
		
		$("body").on( "click", ".apply_filter", function() {
			var filter_tag = $(this).attr("filter_category");
			var filter_data = $(this).attr("filter_value");
			filter_add(filter_tag,filter_data);
		});
		
		$("body").on( "click", ".remove_filter", function() {
			var filter_tag = $(this).attr("filter_tag");
			var filter_data = $(this).attr("filter_data");
			filter_remove(filter_tag,filter_data);
		});
		
		$("body").on( "click", ".lcdoc_history_forward", function() {
			history_forward();
		});
		
		$("body").on( "click", ".lcdoc_history_back", function() {
			history_back();
		});
		
		$(document).keydown(function(e) {
		   switch(e.which) {
			   case 37: // left
					if(!$("#ui_filer").is(":focus")){
						history_back();
						e.preventDefault();
					}
					break;

			   case 38: // up
			   		if($("#table_list").hasClass("table_focused")){
			   			entry_previous();
			   			e.preventDefault();
			   		}
			   		break;

			   case 39: // right
					if(!$("#ui_filer").is(":focus")){
						history_forward();
						e.preventDefault();
					}
					break;

			   case 40: // down
			   		if($("#table_list").hasClass("table_focused")){
			   			entry_next();
			   			e.preventDefault();
			   		}
			   		break;

			   default: return; // exit this handler for other keys
		   }
		   
		});
	}
