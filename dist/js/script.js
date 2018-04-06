$(function(){
	var i = 1;
	$('a.menu').click(function(e){
		// stop browser from refreshing screen
		e.preventDefault();
		var menuNav = $('ul.elgg-menu-site-default');
		// slide menu nav in
		$('ul.elgg-menu-site-default').slideToggle('slow');

		//remove inline styles applied to the site menu when out of mobile view
		$(window).resize(function(){
			var w = $(window).width();

			if(w > 768 && menuNav.is(':hidden')){
				menuNav.removeAttr('style');
			}
		});
	});

	//disable tinyMCE editor on main page when below 990px
	function toggleMCE(toggle, state){
		toggle.trigger('click');
	}

	$(window).resize(function(){
		var mceEditor = $('#ajax-form .mceEditor');
		var toggleBtn  = $("#ajax-form").find(".tinymce-toggle-editor");

		if(window.innerWidth < 990 && mceEditor.length >= 1){
			toggleMCE(toggleBtn, 'hide');
		}
		else if(window.innerWidth >= 991 && mceEditor.length == 0){
			if(toggleBtn.length >= 1){
				toggleMCE(toggleBtn, 'show');
			}
		}
	});

	//disable form submit once form has been submit
	$('form').preventDoubleSubmission();

	$('.elgg-body.elgg-main').wetMessages();

	/*********************************
	** WelcomeWidget CLASS
	**********************************/
	var WelcomeWidget = function(){
		this.setProperties();

		//bind the object to jquery
		$(this.init);
	}

	WelcomeWidget.prototype.setProperties = function(){
		this.ajaxForm = $('#ajax-form');
		this.ajaxLoader = elgg.normalize_url("/_graphics/ajax_loader.gif");
		this.placeholder = true;
		this.filterLink = $('#widget-welcome > ul li');
		this.selectedClass = '.selected';
		this.activeClass = '.active';
		this.contentDiv = $('.widget-welcome-content');
		this.searchBar = $('.index-search input[type=text]');
		this.shareLinks = $('.widget-welcome-content #share-content > a');
		this.createLinks = $('.widget-welcome-content #create-content > a');
		this.firstClick = false;

		that = this;
	}

	WelcomeWidget.prototype.init = function(){
		that.filterLink.click(that.loadButtons)
		that.searchBar.focus(that.clearSearch);
		that.shareLinks.bind('click', {key: 'share'}, that.loadForm);
		that.createLinks.bind('click', {key: 'create'}, that.loadForm);
	}

	//load appropriate button content area
	WelcomeWidget.prototype.loadButtons = function(event){
		event.preventDefault ? event.preventDefault() : event.returnValue = false;

		//if there is content in the ajaxForm area, we need to remove it
		that.ajaxForm.empty();
		that.ajaxForm.append("<form></form>");

		$(this).parents('ul').find(that.selectedClass).removeClass(that.selectedClass.substring(1));
		$(this).addClass(that.selectedClass.substring(1));

		//change content div (either create or share)
		contentLink = $(this).find('a');
		var value = $(contentLink).attr('href');
		that.contentDiv.find(that.activeClass).fadeOut(400, 'easeOutQuad', function(){
			$(this).removeClass(that.activeClass.substring(1));
			$(this).parent().find('#'+value+"-content").addClass(that.activeClass.substring(1)).hide().fadeIn(400, 'easeInQuad');
		});
	}

	//clear the searchbox placeholder when focus is set
	WelcomeWidget.prototype.clearSearch = function(){
		if(that.placeholder){
			$(this).val('');
			that.placeholder = false;
		}
	}

	//
	WelcomeWidget.prototype.loadForm = function(param){
		event = param;
		event.preventDefault ? event.preventDefault() : event.returnValue = false;
		//event.stopPropagation();

		that.ajaxForm.empty();
		that.ajaxForm.append("<div class='ajax-spinner'><img src='"+that.ajaxLoader+"' alt='Loading Content'/></div>");

		var ajaxReq = $(this).attr('href');
		request = (param.data.key == "share") ? 'share_content' : 'create_content';
		elgg.get(request+'/'+ajaxReq.substring(1), {
				success: function(resultText, success, xhr){
						that.ajaxForm.hide();
						that.ajaxForm.children().first().replaceWith(resultText);
						that.ajaxForm.fadeIn(600);
                        tinymce.suffix = '.min';
                            tinyMCE.init({
                                mode : "specific_textareas",
                                editor_selector : "elgg-input-longtext",
                                theme: 'modern',
                                schema:'html5',
                                plugins: [
                                    'advlist link image charmap print preview hr anchor pagebreak',
                                    'searchreplace wordcount visualblocks visualchars code fullscreen',
                                    'insertdatetime media nonbreaking save table contextmenu directionality',
                                    'emoticons template paste textcolor colorpicker textpattern imagetools jbimages jbvideos'
                                ],
                                relative_urls : false,
                                toolbar1: 'insertfile undo redo | styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image',
                                toolbar2: 'print preview media | forecolor backcolor emoticons imagetools jbimages jbvideos',
                                image_advtab: true,
                                width : "100%",
                                extended_valid_elements: "+@[data-options], div",
                                remove_script_host : false,
                                document_base_url : elgg.config.wwwroot,
                            });
				}
		});
	}

	//index  widget - my resources
	var resources = ["all", "learner", "developer", "instructor", "trainingmgr"];
	$('#filter-resources').live('change', function(){
		var role = this.value;
		$('div').removeClass('selected');
		var div = $('div.'+resources[role]);
		$(div).addClass('selected');
	});

	/*********************************
	** ActivityWidget CLASS
	**********************************/ 
	var IndexWidget = function(){
		this.setProperties();

		$(this.init);
	}

	IndexWidget.prototype.setProperties = function(){
		this.activeClass = 'active';
		this.activityFeed = 'div#activity-feed > ul';
		this.activityFilter = $('ul#activity-filter li');
		this.ajaxLoader = elgg.normalize_url("/_graphics/ajax_loader.gif");
		activity_widget = this;
	}

	IndexWidget.prototype.init = function(){
		activity_widget.activityFilter.click(activity_widget.filter);
	}

	IndexWidget.prototype.filter = function(event){
		event.preventDefault ? event.preventDefault() : event.returnValue = false;
		$(this).parent().children().removeClass(activity_widget.activeClass);
		$(this).addClass(activity_widget.activeClass);

		var link = $(this);
		var parentContainer = link.parent().parent();
		var filter = link.find('a').attr('href');
		var oldFeed = parentContainer.find('div#activity-feed > ul');
		var newFeed = $('div#activity-feed > ul');
		activity_widget.getRiver(filter, oldFeed, newFeed);
	}

	IndexWidget.prototype.getRiver = function(filter, oldFeed, newFeed){
		
		oldFeed.fadeOut(400, function(){
			$(this).empty('li');
			$(this).append("<div class='ajax-spinner'><img src='"+activity_widget.ajaxLoader+"' alt='Loading Content...' /></div>").fadeIn(100);
		});
		elgg.get('river_activity/'+filter.substring(1), {
			success: function(resultText, success, xhr){
				oldFeed.fadeOut(400, function(){
					if(resultText){
						$(this).replaceWith(resultText);
						newFeed.fadeIn(400);
					}
					else{
						$(this).replaceWith("<ul></ul>");
					}
				});
			}
		});
	}

	/*
	 * FOR TIME BEING: REMOVING THIS 
	//feature tour for the front page
	elgg.get('feature/hasSeen/landingFeature', {
		success: function(resultText, success, xhr){
			if(!resultText){
			  	$('#joyRideTipContent').joyride({
		          autoStart : true,
		          modal:true,
		          expose: true,
		          prevButton:true
	        	});
			 
		        elgg.post('feature/seen/landingFeature', {
		        	success: function(resultText, success, xhr){

		        	},
		        	error: function(){

		        	}
		        });
		    }
		}
	});
	*/

	$('#add-bookmark').click(function(e){
		e.preventDefault();
		var link = elgg.get_site_url() + "bookmarks/add/"+elgg.get_logged_in_user_guid()+"?address="+document.URL;
		
		$.fancybox({
			href: link,
			width: 600,
			height:500,
			padding:16,
			titleShow: false,
			autoDimensions: false
		});

	});

	$('form#ajax-form').live("submit", function(event){
		//clear validation messages
		$("p.error").remove();
		var token = $(this).find("input[name=__elgg_token]").val();
		var ts = $(this).find("input[name=__elgg_ts]").val();
		var title = $(this).find("input[name=title]").val();
		var description = $(this).find("textarea[name=description]").val();
		var address = $(this).find("input[name=address]").val();
		var access_id = $(this).find("select[name=access_id]").val();
		var tags = $(this).find("input[name=tags]").val();
		var guid = $(this).find("input[name=guid]").val() ? $(this).find("input[name=guid]").val(): null;
		var bookmark_container_guid = $(this).find("input[name=container_guid]").val();

		if(title && address){
			var request = elgg.post('action/bookmarks/save', {
				data:{
					__elgg_token: token,
					__elgg_ts: ts,
					title: title,
					description: description,
					address: address,
					access_id: access_id,
					tags: tags,
					guid: guid,
					container_guid:bookmark_container_guid
				}
			});
			request.done(function(resultText){
				obj = JSON.parse(resultText);
				success = obj.system_messages.success;
				error = obj.system_messages.error;

				$.fancybox.close();

				if(success){
					elgg.system_message(success);
				}
				else if(error){
					elgg.system_message(error);
				}
			});
		}
		else if(!title){		
			var position = $(this).find("input[name=title]").position();
			$(this).find("input[name=title]").prevAll("label").append("<p class='error' style='display:inline-block;color:red;margin-left:5px;'>*Please provide a title</p>");
			$("#fancybox-content > div").scrollTop(position['top']);
		}
		else if(!address){
			var position = $(this).find("input[name=address]").position();
			$(this).find("input[name=address]").prevAll("label").append("<p class='error' style='display:inline-block;color:red;margin-left:5px;'>*Please provide an address</p>");
			$("#fancybox-content > div").scrollTop(position['top']);
		}
		return false;
	});

	$('#start-tour').click(function(e){
		e.preventDefault();
		joyRideContent = $('#joyRideTipContent');
		if(jQuery.contains(document, joyRideContent[0])){
			$('#joyRideTipContent').joyride({
			          autoStart : true,
			          modal:true,
			          expose: true,
			          prevButton: true
		    });
		}
		else{
			alert('No Training Aid For This Page');
		}
	});

	//filter dropdown
	$('#filter-dropdown > a').click(function(e){
		e.preventDefault ? e.preventDefault() : e.returnValue = false;
		that = $(this);
		filterDropdown = $(this).parent().find('ul');
		$(filterDropdown).css('width', that.innerWidth()-1);
		$(filterDropdown).slideToggle();
	});

	/* Autcomplete User Tagging for comments/questions
	******************************/
   /*
	* FOR TIME BEING: REMOVING THIS
	var users;
	function getUsers(){
		var arr = new Array();
		$.ajax({
			url:elgg.get_site_url() +'users/get',
			//async:false,
			success: function(resultText){
				users = JSON.parse(resultText);
			}
		});
	}
	getUsers();
	*/
	function split(val) {
	    return val.split(/@\s*/);
	}

	function extractLast(term) {
	    return split(term).pop();
	}
	var callouts = ["input[name='generic_comment']", "input[name='questiontitle']"];
	var names = [];


	

	var welcomeWidget = new WelcomeWidget();
	var actvityWidget = new IndexWidget();
	if($('#activity-feed').length) {
		actvityWidget.getRiver('#all', $('div#activity-feed > ul'), $('div#activity-feed > ul'));
	}
	
	//var messageBox = new MessageBox();
});

