
// Initialize immediately when script loads
(function initInlineScripts() {
    if (typeof jQuery === 'undefined') {
        setTimeout(initInlineScripts, 50);
        return;
    }

    jQuery(function($) {
        items_set = [
            {
                category: 'branding',
                lika_count: '77',
                view_count: '234',
                src: 'images/prettyPhotoImages/pic9.jpg',
                title: 'Foil Mini Badges',
                content: ''
            },
            {
                category: 'polygraphy',
                lika_count: '45',
                view_count: '100',
                src: 'images/prettyPhotoImages/pic7.jpg',
                title: 'Darko – Business Card Mock Up',
                content: ''
            },
            {
                category: 'text_styles',
                lika_count: '22',
                view_count: '140',
                src: 'images/prettyPhotoImages/pic8.jpg',
                title: 'Woody Poster Text Effect',
                content: ''
            }
        ];
        jQuery('.portfolio_block').portfolio_addon({
            type: 1, // 2-4 columns simple portfolio
            load_count: 3,

            items: items_set
        });
    $('#container').isotope({
        animationOptions: {
            duration: 900,
            queue: false
        }
    });

    
    // In case the window.load event happens before the script has loaded,
    // we trigger a resize event to make elements 'fall into place'
    $(window).trigger('resize');
    //window.dispatchEvent(new Event('resize'));
});


$(document).ready(function() {


    $(".rslides").responsiveSlides({
        speed: 1000,
        timeout: 4000,
        auto: true,
        pager: true,
        manualControls: '#rslidesControl'
    });



    var bLazy = new Blazy({
        offset: 80
    });



    $(".bhide").click(function() {
        $(".hideObj").slideDown(function() {
            bLazy.revalidate();
        });
        $(this).hide(); //.attr()
        return false;
    });
    $(".bhide2").click(function() {
        $(".container.hideObj2").slideDown(function() {
            bLazy.revalidate();
        });
        $(this).hide(); // .attr()
        return false;
    });

    $('.heart').mouseover(function() {
        $(this).find('i').removeClass('fa-heart-o').addClass('fa-heart');
    }).mouseout(function() {
        $(this).find('i').removeClass('fa-heart').addClass('fa-heart-o');
    });

    function sdf_FTS(_number, _decimal, _separator) {
        var decimal = (typeof(_decimal) != 'undefined') ? _decimal : 2;
        var separator = (typeof(_separator) != 'undefined') ? _separator : '';
        var r = parseFloat(_number)
        var exp10 = Math.pow(10, decimal);
        r = Math.round(r * exp10) / exp10;
        rr = Number(r).toFixed(decimal).toString().split('.');
        b = rr[0].replace(/(\d{1,3}(?=(\d{3})+(?:\.\d|\b)))/g, "\$1" + separator);
        r = (rr[1] ? b + '.' + rr[1] : b);

        return r;
    }

    setTimeout(function() {
        $('#counter').text('0');
        $('#counter1').text('0');
        $('#counter2').text('0');
        setInterval(function() {

            var curval = parseInt($('#counter').text());
            var curval1 = parseInt($('#counter1').text().replace(' ', ''));
            var curval2 = parseInt($('#counter2').text());
            if (curval <= 707) {
                $('#counter').text(curval + 1);
            }
            if (curval1 <= 12280) {
                $('#counter1').text(sdf_FTS((curval1 + 20), 0, ' '));
            }
            if (curval2 <= 245) {
                $('#counter2').text(curval2 + 1);
            }
        }, 2);

    }, 500);




    jQuery('#menu').slicknav();



    // Fixed menu slide-in on scroll
    var $fixedMenu = $("#menuFixed");
    var menuThreshold = 100;

    function updateFixedMenuVisibility() {
        var scrollTop = $(window).scrollTop();

        if (scrollTop > menuThreshold) {
            $fixedMenu.addClass("visible");
        } else {
            $fixedMenu.removeClass("visible");
        }
    }

    // Check on page load
    updateFixedMenuVisibility();

    // And show the fixed menu container
    $fixedMenu.show();

    // Check on scroll
    $(window).scroll(updateFixedMenuVisibility);

    // Smooth scroll for fixed menu links
    $('#menuFixedNav a').click(function(e) {
        e.preventDefault();
        var target = $(this).attr('href');
        $('html, body').animate({
            scrollTop: $(target).offset().top - 80
        }, 800);
    });

    // Update active state for fixed menu based on scroll position
    $(window).scroll(function() {
        var scrollPos = $(window).scrollTop() + 200;

        $('#menuFixedNav a').each(function() {
            var target = $(this).attr('href');
            if ($(target).length) {
                var targetTop = $(target).offset().top;
                var targetBottom = targetTop + $(target).outerHeight();

                if (scrollPos >= targetTop && scrollPos < targetBottom) {
                    $('#menuFixedNav li').removeClass('active');
                    $(this).parent().addClass('active');
                }
            }
        });
    });



    var chart = $('.chart'),
        chartNr = $('.chart-content'),
        chartParent = chart.parent();

    function centerChartsNr() {
        chartNr.css({
            top: (chart.height() - chartNr.outerHeight()) / 2
        });
    }

    if (chart.length) {
        centerChartsNr();
        $(window).resize(centerChartsNr);

        chartParent.each(function () {
            $(this).onScreen({
                doIn: function () {
                    $(this).find('.chart').easyPieChart({
                       animate: 1000,
                      lineWidth: 3,
                      barColor:'#2f2f2f',
                      trackColor:'#dcdcdc',
                      lineCap:false,
                      lineWidth:'2',
                      size:'72',
                      scaleColor:false,
                        
                        scaleColor:false,
                        animate: 2000,
                        onStep: function (from, to, percent) {
                            $(this.el).find('.percent').text(Math.round(percent));
                        }
                    });
                },
            });
        });
    }



    function calculateScroll() {
        var contentTop = [];
        var contentBottom = [];
        var winTop = $(window).scrollTop();
        var rangeTop = 200;
        var rangeBottom = 500;
        $('.navmenu').find('a').each(function() {
            contentTop.push($($(this).attr('href')).offset().top);
            contentBottom.push($($(this).attr('href')).offset().top + $($(this).attr('href')).height());
        })
        $.each(contentTop, function(i) {
            if (winTop > contentTop[i] - rangeTop && winTop < contentBottom[i] - rangeBottom) {
                $('.navmenu li')
                    .removeClass('active')
                    .eq(i).addClass('active');
            }
        })
    };

    calculateScroll();

    $(window).scroll(function(event) {
        calculateScroll();
    });
    $('.navmenu ul li a').click(function() {
        $('html, body').animate({
            scrollTop: $(this.hash).offset().top - 80
        }, 800);
        return false;
    });




    jQuery(".pretty a[rel^='prettyPhoto']").prettyPhoto({
        animation_speed: 'normal',
        theme: 'light_square',
        slideshow: 3000,
        autoplay_slideshow: true,
        social_tools: ''
    });





    jQuery('#map').one('click', function(){
        // Lazy load Leaflet JS
        window.initLeafletMap = function() {
            // Initialize map after Leaflet loads
            var map = L.map('map').setView([40.7147, -73.9407], 14);

            // Add grayscale tile layer (matching the original style)
            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 20
            }).addTo(map);

            // Add marker
            const baseUrl = window.location.origin + '/';
            L.marker([40.7147, -73.9407], {
                icon: L.icon({
                    iconUrl: baseUrl + 'images/marker-icon.png',
                    iconRetinaUrl: baseUrl + 'images/marker-icon-2x.png',
                    shadowUrl: baseUrl + 'images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                })
            }).addTo(map)
                .bindPopup('<div style="font-size: 16px; font-weight: 500;">New York</div>')
                .openPopup();

            // Remove static map background image once dynamic map is loaded
            map.whenReady(function() {
                $('#map').css('background-image', 'none');
            });
        };

        var mapjs = document.createElement("script");
        mapjs.src = "js/leaflet.min.js";
        mapjs.onload = function() {
            initLeafletMap();
        };
        var s = document.getElementsByTagName("script")[0];
        s.parentNode.insertBefore(mapjs, s);
    });

    }); // End jQuery ready
})(); // End initInlineScripts


