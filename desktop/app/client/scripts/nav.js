/**
 * The nav stuff
 */
(function( window ){
	
	'use strict';

	var body = $('body'),
		mask = $("<div class='mask'></div>"),
		toggleSlideLeft = $( ".toggle-slide-left" ),
		toggleSlideRight = $( ".toggle-slide-right" ),
		toggleSlideTop = $( ".toggle-slide-top" ),
		toggleSlideBottom = $( ".toggle-slide-bottom" ),
		activeNav
	;

	/* slide menu left */
	toggleSlideLeft.addEventListener( "mouseover", function(){
		$('body').addClass("sml-open" );
		document.body.appendChild(mask);
		activeNav = "sml-open";
	} );

	/* slide menu right */
	toggleSlideRight.addEventListener( "mouseover", function(){
		$('body').addClass("smr-open" );
		document.body.appendChild(mask);
		activeNav = "smr-open";
	} );

	/* slide menu top */
	toggleSlideTop.addEventListener( "mouseover", function(){
		$('body').addClass("smt-open" );
		document.body.appendChild(mask);
		activeNav = "smt-open";
	} );

	/* slide menu bottom */
	toggleSlideBottom.addEventListener( "mouseover", function(){
		$('body').addClass("smb-open" );
		document.body.appendChild(mask);
		activeNav = "smb-open";
	} );

	/* hide active menu if mask is clicked */
	mask.addEventListener( "mouseover", function(){
		$('body').removeClass(activeNav );
		activeNav = "";
		document.body.removeChild(mask);
	} );

	/* hide active menu if close menu button is clicked */
	[].slice.call($(".close-menu")).forEach(function(el,i){
		el.addEventListener( "click", function(){
			$('body').removeClass(activeNav );
			activeNav = "";
			document.body.removeChild(mask);
		} );
	});


})( window );