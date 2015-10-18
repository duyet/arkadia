
var zoom = (function(){

	window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

	var canvas = document.getElementById('zc');
	var zc = $('#zc');
	var context;
	//
	var window_w, window_h;
	var center_x, center_y;
	var element_w;
	var element_h;
	var startposition = 0;
	var z_position = 0
	var lastframe = null;
	var steps;
	//
	var playback = true;
	var hue = 0;
	var fx = 'hueani'; 

	var direction = 1;
	var keyboardMap = {up:false,down:false};
	//
	var slowspeed = 2;
	var fastspeed = 7;
	var speedfactor = 1.3;
	var portrait = false;

	var speed = slowspeed;
	var visiblesteps = 4;
	var color1 = '#222';
	var color2 = '#444';
	var loaded = false;
	var loadpercent = 0;
	var tilewidth = 1200;
	var tileheight = 900;
	var loadcompleted = false;
	var z_opac = 0;
	var z_opac_target = 0;
	var visitstart = Date.now();
	var filterelements = $('.filtered');
	
	var imgarray = [];
	for (var i = 0; i <= 48; i++) {
		imgarray.push('./images/arkadia'+i+'.jpg');
	};


	var length = imgarray.length;
	/* SETUP */
	$(window).resize(function() {
		resize();
	});

	function setup(){
		context = canvas.getContext('2d');
		resize();
		setupsteps();
		waitforloaded();
		window.requestAnimationFrame(loop);
		setTimeout(function(){
			if (!loaded) $("#status").css({'opacity':'1'});
		},1000);

	}
	function waitforloaded(){
		if (loaded) {
			$("#loading").animate({'opacity':0},1000);
		} else {
			setTimeout(function(){waitforloaded();},10);
		}

	}
	function resize(scale){

		if(window.devicePixelRatio !== undefined) {
		    dpr = window.devicePixelRatio;
		} else {
		    dpr = 1;
		}
		var w = $(window).width();
		var h = $(window).height();
		window_w = w * dpr;
		window_h = h * dpr;
		
		center_x = window_w/2;
		center_y = window_h/2;

		if (window_w>window_h*(tilewidth/tileheight)){
			element_w = window_w;
			element_h = window_w*(tileheight/tilewidth);
		} else {
			element_w = window_h*(tilewidth/tileheight);
			element_h = window_h;
		}
		portrait = (window_h > window_w);

		$('#zc').attr('width',window_w);
		$('#zc').attr('height',window_h);

	}
	function loadstatus(){
		if (!loaded) {		
			loadpercent = 0;
			var isready = steps.every(function(element){
				if (element.ready) loadpercent += 100/steps.length;
				return element.ready;
			});
			$('#loadbar').css('width',Math.floor(loadpercent)+'%');
			if (isready) {
				$("#zc").animate({'opacity':1},(100-z_opac)*5);
				loadcompleted = true;
				navFade();
			}
			return isready;
		} else return true;
	}

	/* IMG OBJECT */
	function zoom_img(src) {
		var that = this;
		this.ready = false;
		this.img = new Image();
		this.img.onload = function(){
			that.ready = true;
			if (loadstatus()){
				loaded = true;
				var loadtime = (Date.now() - visitstart)/1000;
			}
		};
		this.img.src = src;
	}

	/* POPULATE STEP OBJECTS ARRAY */
	function setupsteps() {
		steps = [];
		for (var i = 0; i < imgarray.length; i++) {
			steps.push(new zoom_img(imgarray[i]));
		}
	}

	/* ANIMATION LOOP */
	function loop(timestamp){
		var elapsed = 0;
		if (!lastframe) {
			lastframe = timestamp;
		} else {
  			elapsed = timestamp - lastframe;
  			lastframe = timestamp;
		}

		// CONTROL
		if (loaded) {
			var zoomspeed = 0.0003*elapsed

			if (keyboardMap.up) {
				z_position += zoomspeed*3;
			} else if (keyboardMap.down){
				z_position -= zoomspeed*3;
			} else if (playback) {
				z_position += (zoomspeed/8*((portrait)?speed*speedfactor:speed));
			}
			if (z_position<0) {
				z_position+=steps.length;
			}
			if (z_position>steps.length) {
				z_position-=steps.length;
			}
		}

		// DISPLAY
		context.clearRect(0, 0, canvas.width, canvas.height);
		// build array of visible steps, looping end to the beginning
		var steparray = [];
		for (var i = 0; i < visiblesteps; i++) {
			steparray.push( steps[ (Math.floor(z_position)+i)%steps.length ] );
		}
		// 
		var scale = Math.pow(2,(z_position%1));
		// draw the collected image steps
		for (var i = 0; i < steparray.length; i++) {
			var x = center_x - element_w/2*scale;
			var y = center_y - element_h/2*scale;
			var w = element_w*scale;
			var h = element_h*scale;

			if (steparray[i].ready) {
				context.drawImage(steparray[i].img,x,y,w,h);
			} else {
				context.fillStyle = ((Math.floor(z_position)+i)%2===0)?color1:color2;
				context.fillRect (x,y,w,h);
			}
			scale *= 0.5;
		}


		if (!loadcompleted) {
			if ( steparray.every(function(e){return e.ready})){
				z_opac_target = loadpercent;
			}
			if (z_opac < z_opac_target) {
				z_opac +=0.5;
			}

			$('#zc').css('opacity',(z_opac/100));
			// z_position = startposition+(z_opac/2000);
			z_position = startposition;


			if (loaded) {

			}
		}

		if (fx === 'hueani') {
			hue += elapsed/50;
			if (hue >= 360) hue-= 360;

			filterelements.css('-webkit-filter', 'hue-rotate('+hue+'deg)');
			filterelements.css('-moz-filter', 'hue-rotate('+hue+'deg)');
			filterelements.css('-ms-filter', 'hue-rotate('+hue+'deg)');
			filterelements.css('-o-filter', 'hue-rotate('+hue+'deg)');
			filterelements.css('filter', 'hue-rotate('+hue+'deg)');
		}

		updateNavBar();
 		window.requestAnimationFrame(loop);
	}

	if(canvas.getContext) {
		setup();
	}

	/** nav **/

	var nav = document.getElementById("nav");
	var marker = $(".seekbar .marker");
	var seekbar = $(".seekbar");
	var seekbar_visible = $(".seekbar-visible");
	var preview = $("#preview");
	preview.attr('width',150);
	preview.attr('height',100);

	var previewcanvas = document.getElementById('preview');
	var previewcontext = previewcanvas.getContext('2d');;

	var preview_w = previewcanvas.width;
	var preview_h = previewcanvas.width*(tileheight/tilewidth);

	var preview_center_x = previewcanvas.width/2;
	var preview_center_y = previewcanvas.height/2;


	function updateNavBar() {
		var percent = z_position / length;
		marker.css('left',percent*100+"%");
	}

	seekbar.click(function(e) {
		var percent =  e.pageX / seekbar.width();
		z_position = length * percent;		 
	});

	seekbar.mousemove(function(e) {
		var percent =  e.pageX / seekbar.width();
		var lp = (percent * seekbar.width()) - preview.width()/2;
		var m = 5;
		if (lp < m) lp = m;
		if (lp > seekbar.width()-preview.width()-m) lp = seekbar.width()-preview.width()-m;
		preview.css('left',lp);
		drawPreview( length*percent );
	});

	function drawPreview(position) {
		if (loaded) {
			previewcontext.clearRect(0, 0, previewcanvas.width, previewcanvas.height);
			var steparray = [];
				steparray.push( steps[ (Math.floor(position))%steps.length ] );
			var scale = Math.pow(2,(position%1));
			for (var i = 0; i < steparray.length; i++) {
				var x = preview_center_x - preview_w/2*scale;
				var y = preview_center_y - preview_h/2*scale;
				var w = preview_w*scale;
				var h = preview_h*scale;
				if (steparray[i].ready) {
					previewcontext.drawImage(steparray[i].img,x,y,w,h);
				} else {
					previewcontext.fillStyle = ((Math.floor(position)+i)%2===0)?color1:color2;
					previewcontext.fillRect (x,y,w,h);
				}
				scale *= 0.5;
			}
		}
 	}

	seekbar.mouseenter(function() {
		preview.fadeIn(400);
		seekbar_visible.animate({'height':'100%'},{duration:400,queue:false});
	});
	seekbar.mouseleave(function() {
		preview.fadeOut(400);
		seekbar_visible.animate({'height':'50%'},{duration:400,queue:false});
	});





	var idletime = Date.now();
	var navO = 0;
	nav.addEventListener('mousemove', function(e) {
		idletime = Date.now();
	});
	function navFade(){
		if (Date.now() - idletime > 5000) {
			if (navO > 0) {	
				navO -= 0.05;
			}
			nav.style.opacity = navO;
			nav.style.cursor = "none";
			setTimeout(navFade,40);
		} else if (navO < 1) {
			navO += 0.05;
			nav.style.opacity = navO;
			nav.style.cursor = "default";
			setTimeout(navFade,40);
		} else {
			setTimeout(navFade,100)
		}
	};
	

	var button_nofx = $("#nofx");
	var button_color = $("#color");
	var button_sw = $("#sw");
	var fxbuttons = $(".button.fx");

	var button_settings = $("#settings");
	var button_info = $("#info");

	var button_ff = $("#ff");
	var button_f = $("#f");
	var button_p = $("#p");
	var button_r = $("#r");
	var button_rr = $("#rr");
	var speedbuttons = $(".icon.speed");
	


	button_f.addClass('active');
	button_color.addClass('active');
	var active_speed_button = button_f;

	fxbuttons.mousedown(function(e){
		fxbuttons.removeClass('active');
		$(e.target).addClass('active');
	});

	button_nofx.mousedown(function(e){
		fx = false;
		filterelements.css('-webkit-filter', 'none');
		filterelements.css('-moz-filter', 'none');
		filterelements.css('-ms-filter', 'none');
		filterelements.css('-o-filter', 'none');
		filterelements.css('filter', 'none');
	});	
	button_color.mousedown(function(e){
		fx = 'hueani';
		hue = Math.random()*360;
	});	
	button_sw.mousedown(function(e){
		fx = 'sw';
		filterelements.css('-webkit-filter', 'grayscale(100%)');
		filterelements.css('-moz-filter', 'grayscale(100%)');
		filterelements.css('-ms-filter', 'grayscale(100%)');
		filterelements.css('-o-filter', 'grayscale(100%)');
		filterelements.css('filter', 'grayscale(100%)');
	});	


	button_settings.mousedown(function(e) {
		button_info.removeClass('active');
		$('body').removeClass('creditsvisible');
		if (button_settings.hasClass('active')) {
			button_settings.removeClass('active');
			$('body').removeClass('settingsvisible');
		} else {
			button_settings.addClass('active');
			$('body').addClass('settingsvisible');
		}
	});

	button_info.mousedown(function(e) {
		button_settings.removeClass('active');
		$('body').removeClass('settingsvisible');
		if (button_info.hasClass('active')) {
			button_info.removeClass('active');
			$('body').removeClass('creditsvisible');
		} else {
			button_info.addClass('active');
			$('body').addClass('creditsvisible');
		}
	});

	speedbuttons.mousedown(function(e){
		speedbuttons.removeClass('active');
		$(e.target).addClass('active');
	});


	button_ff.mousedown(function(e){
		playback = true;
		speed = fastspeed;
		active_speed_button = $(e.target);
	});	
	button_f.mousedown(function(e){
		playback = true;
		speed = slowspeed;
		active_speed_button = $(e.target);
	});
	button_p.mousedown(function(e){
		playback = false;
	});
	button_r.mousedown(function(e){
		playback = true;
		speed = -slowspeed;
		active_speed_button = $(e.target);
	});
	button_rr.mousedown(function(e){
		playback = true;
		speed = -fastspeed;
		active_speed_button = $(e.target);
	});

	/* KEYBOARD */
		$(document).keydown(function(event) {
			if (event.which === 32) {
				playback = !playback;
				speedbuttons.removeClass('active');
				if (playback) {
					active_speed_button.addClass('active');
				} else {
					button_p.addClass('active');
				}
				event.preventDefault();
			}
			if (event.which === 38) {keyboardMap.up = true;event.preventDefault();}
			if (event.which === 40) {keyboardMap.down = true;event.preventDefault();}
		});
		$(document).keyup(function(event) {
			if (event.which === 38) {keyboardMap.up = false;event.preventDefault();}
			if (event.which === 40) {keyboardMap.down = false;event.preventDefault();}
		});



	/****************/
	/* Fullscreen	*/
	/****************/

	var isFullscreen = false;
	$('#fullscreen').mousedown(function(e) {
		toggleFullScreen();
	});
	document.addEventListener('fullscreenchange', function () {
	    isFullscreen = !!document.fullscreen;
	    fullscreenchange();
	}, false);
	document.addEventListener('mozfullscreenchange', function () {
	    isFullscreen = !!document.mozFullScreen;
	    fullscreenchange();
	}, false);
	document.addEventListener('webkitfullscreenchange', function () {
	    isFullscreen = !!document.webkitIsFullScreen;
	    fullscreenchange();
	}, false);
	function fullscreenchange() {
	    if(isFullscreen) {
			$('#fullscreen').addClass('active');
	    } else {
			$('#fullscreen').removeClass('active');
	    }
	}
	function toggleFullScreen() {
		if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement ) {
			if (document.documentElement.requestFullscreen) {
			  document.documentElement.requestFullscreen();
			} else if (document.documentElement.msRequestFullscreen) {
			  document.documentElement.msRequestFullscreen();
			} else if (document.documentElement.mozRequestFullScreen) {
			  document.documentElement.mozRequestFullScreen();
			} else if (document.documentElement.webkitRequestFullscreen) {
			  document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
			}
		} else {
			if (document.exitFullscreen) {
			  document.exitFullscreen();
			} else if (document.msExitFullscreen) {
			  document.msExitFullscreen();
			} else if (document.mozCancelFullScreen) {
			  document.mozCancelFullScreen();
			} else if (document.webkitExitFullscreen) {
			  document.webkitExitFullscreen();
			}
		}
	}

})();
