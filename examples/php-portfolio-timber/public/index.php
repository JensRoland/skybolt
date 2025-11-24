<?php
    require_once __DIR__ . '/../vendor/autoload.php';

    use Skybolt\Skybolt;

    // Initialize Skybolt v3
    $sb = new Skybolt(
        renderMapPath: __DIR__ . '/../dist/.skybolt/render-map.json'
    );

    header('Content-Type: text/html; charset=UTF-8');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Timber v3 - Skybolt Demo</title>
    <meta name="description" content="Timber - Elegant one-page business template. We listen, discuss, and develop solutions for your online business. Fast, reliable, and affordable.">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <?php // Preload critical hero background image ?>
    <?= $sb->preload('public/images/bgTop.jpg', as: 'image', fetchpriority: 'high') ?>

    <?php // Critical CSS ?>
    <?= $sb->css('src/css/critical.css') ?>

    <?php // Skybolt launcher script ?>
    <?= $sb->launchScript() ?>

    <?php // Main CSS - async loaded ?>
    <?= $sb->css('src/css/main.css') ?>

    <?php // Web fonts - async loaded ?>
    <?= $sb->css('src/css/fonts-inline.css') ?>

    <?php // Concatenated JavaScript bundle (legacy jQuery code - not a module) ?>
    <?= $sb->script('src/js/scripts.js', module: false) ?>
</head>
<body>

    <!-- Fixed menu that slides in from top on scroll -->
    <div id="menuFixed" class="fixed-menu" style="display: none;">
        <div class="container">
            <div class="row">
                <div class="logo col-md-4">
                    <div>
                        <a href="#home">
                            <span style="display:inline-block; width:107px; height:37px; background:url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGsAAAAlCAMAAAByM+ciAAAAPFBMVEUAAAD///////8fzf////////8fzf////////////////////////////////////////////8fzf////9wWSPOAAAAEnRSTlMAABEiIjNERFVmd4iZqrvM3e5yBl1ZAAACwUlEQVRIid2W4dKcIAxFgQ+KIKiU93/XJiGg7rLCj512ppmdUZDkkJuIK35+v9gvYTOYAMNr3kSzlSZ0fULmHT/MNwvXid0rCSaGrKwaK3VYOR92xMItzbF8RdncZeVsxqy8AqvYT6FcYp7uTcT1zqJ0fFvRpqqVCcjH7OQ2w2oipg6rwNQjS6pEiY1Y6RTR8vDO0u/4N5ZERbYh69iaiGsZ9VhmwPJTrOSaiJDT+s7C5+m5XiWvOK6XqiLirDm6veFHLHTzY5aILCLsbRdX1tnOLXQzfWUZVGOf6Hm1sIgJ999jBfOZ1WzXEyyNDevKpBbdONkNWYeWMywUMQoRUMIbqxQn4O3HPrzsZ4JlRBGRJOywBBYjPPaGjnQ7ZlmqlFsI0ntxsROPR5aUeEiFKRbIFAN1Y49VVz+xaD9TLMypSNhjuYm86IWfYvGhq/osrFecYOU5Fn1MMN47S1Efuu+xbI13Y53Wvl+nhRvLsi4TLDwukvrIimLEIr9ljrVywA4reSOGLEknIt//FfsPWC58lUVH9wQruH/FwrMO/gSnQCe/2umyRTwupdrogmsCXOFPwGEKCr/qPMS/PDZc3ZDlEj7E4BwTWG5XcoNnsMYmiBogBMxsUh9WrgEWLm3N4aTbzrx4CFQH3gt4sxuwVDLgVvIqMYG1Wfy3CB6KAuAlLDTr16oCTKC/3RGiKqsOM1xS8WY31lAfhVViChY+0w/u6XWFhNHJBqn3NgJ/Oteyrqw6JE/ZWOCGrPIhQRbHvOZVVqciEW0wyBhodeS84q036vCF5YlloFg1r1R7o9WrrMYWWLleC0IsVuWsl/bnZnh4ZRU3ZIHAEWa9lxzz0ofMwp7xWGRqKJvyHjwdaDv3oS0sD/3Fwxur9SHceUjIwNekxPz4fm32dcb3zoKx22mzrAX25j4s/TILRZhJ65H1B4B+cp9pAmFBAAAAAElFTkSuQmCC') no-repeat;"></span>
                        </a>
                    </div>
                </div>

                <div class="col-md-8">
                    <div class="navmenu" style="text-align: center;">
                        <ul id="menuFixedNav">
                            <li><a href="#home">Home</a></li>
                            <li><a href="#about">About</a></li>
                            <li><a href="#project">Projects</a></li>
                            <li><a href="#news">News</a></li>
                            <li class="last"><a href="#contact">Contact</a></li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!--home start-->
    
    <div id="home">
        <div class="headerLine">
            <div id="menuF" class="default">
                <div class="container">
                    <div class="row">
                        <div class="logo col-md-4">
                            <div>
                                <a href="#">
                                    <span style="display:inline-block; width:107px; height:37px; background:url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGsAAAAlCAMAAAByM+ciAAAAPFBMVEUAAAD///////8fzf////////8fzf////////////////////////////////////////////8fzf////9wWSPOAAAAEnRSTlMAABEiIjNERFVmd4iZqrvM3e5yBl1ZAAACwUlEQVRIid2W4dKcIAxFgQ+KIKiU93/XJiGg7rLCj512ppmdUZDkkJuIK35+v9gvYTOYAMNr3kSzlSZ0fULmHT/MNwvXid0rCSaGrKwaK3VYOR92xMItzbF8RdncZeVsxqy8AqvYT6FcYp7uTcT1zqJ0fFvRpqqVCcjH7OQ2w2oipg6rwNQjS6pEiY1Y6RTR8vDO0u/4N5ZERbYh69iaiGsZ9VhmwPJTrOSaiJDT+s7C5+m5XiWvOK6XqiLirDm6veFHLHTzY5aILCLsbRdX1tnOLXQzfWUZVGOf6Hm1sIgJ999jBfOZ1WzXEyyNDevKpBbdONkNWYeWMywUMQoRUMIbqxQn4O3HPrzsZ4JlRBGRJOywBBYjPPaGjnQ7ZlmqlFsI0ntxsROPR5aUeEiFKRbIFAN1Y49VVz+xaD9TLMypSNhjuYm86IWfYvGhq/osrFecYOU5Fn1MMN47S1Efuu+xbI13Y53Wvl+nhRvLsi4TLDwukvrIimLEIr9ljrVywA4reSOGLEknIt//FfsPWC58lUVH9wQruH/FwrMO/gSnQCe/2umyRTwupdrogmsCXOFPwGEKCr/qPMS/PDZc3ZDlEj7E4BwTWG5XcoNnsMYmiBogBMxsUh9WrgEWLm3N4aTbzrx4CFQH3gt4sxuwVDLgVvIqMYG1Wfy3CB6KAuAlLDTr16oCTKC/3RGiKqsOM1xS8WY31lAfhVViChY+0w/u6XWFhNHJBqn3NgJ/Oteyrqw6JE/ZWOCGrPIhQRbHvOZVVqciEW0wyBhodeS84q036vCF5YlloFg1r1R7o9WrrMYWWLleC0IsVuWsl/bnZnh4ZRU3ZIHAEWa9lxzz0ofMwp7xWGRqKJvyHjwdaDv3oS0sD/3Fwxur9SHceUjIwNekxPz4fm32dcb3zoKx22mzrAX25j4s/TILRZhJ65H1B4B+cp9pAmFBAAAAAElFTkSuQmCC') no-repeat;"></span>
                                </a>
                            </div>
                        </div>

                        <div class="col-md-8">
                            <div class="navmenu"style="text-align: center;">
                                <ul id="menu">
                                    <li class="active" ><a href="#home">Home</a></li>
                                    <li><a href="#about">About</a></li>
                                    <li><a href="#project">Projects</a></li>
                                    <li><a href="#news">News</a></li>
                                    <li class="last"><a href="#contact">Contact</a></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="container">
                <div class="row wrap">
                    <div class="col-md-12 rslidesWrapper">
                        <ul class="rslides">
                            <li><div class="slideContent"><h2>We listen.</h2></div></li>
                            <li><div class="slideContent"><h2>We discuss.</h2></div></li>
                            <li><div class="slideContent"><h2>We develop.</h2></div></li>
                        </ul>
                        <ul id="rslidesControl">
                            <li class="rslides_here"><a href="#">1</a></li><li><a href="#">2</a></li><li><a href="#">3</a></li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
        <div class="container">
            <div class="row">
                <div class="col-md-4 project">
                    <h3 id="counter">0</h3>
                    <h4>Awesome Projects</h4>
                    <p>Dolor sit amet, consectetur adipiscing elit quisque tempus eget diam et lorem a laoreet phasellus ut nisi id leo molestie. </p>
                </div>
                <div class="col-md-4 project">
                    <h3 id="counter1">0</h3>
                    <h4>Happy Customers</h4>
                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit quisque tempus eget diam et. laoreet phasellus ut nisi id leo.  </p>
                </div>
                <div class="col-md-4 project">
                    <h3 id="counter2" style="margin-left: 20px;">0</h3>
                    <h4 style="margin-left: 20px;">Professional Awards</h4>
                    <p>Consectetur adipiscing elit quisque tempus eget diam et laoreet phasellus ut nisi id leo molestie adipiscing vitae a vel. </p>
                </div>
            </div>
        </div>
        <div class="container">
            <div class="row">
                <div class="col-md-12 cBusiness">
                    <h3>The Best Way to Create Business Site &ndash; Attractive One Page</h3>
                    <h4>Discover elegant solution for your online business fast, reliable, affordable.</h4>
                </div>
            </div>
        </div>
        <div class="container">
            <div class="row">
                <div class="col-md-12 centPic">
                    <img class="img-responsive b-lazy" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" data-src="images/bizPic.png" width="799" height="463" alt="Business illustration"/>
                </div>
            </div>
        </div>   
    </div>
    
    <!--about start-->    
    
    <div id="about">
        <div class="line2">
            <div class="container">
                <div class="row Fresh">
                    <div class="col-md-4 Des">
                        <i class="fa fa-heart b-lazy" data-src="images/cir.png"></i>
                        <h4>Fresh &amp; Clean Design</h4>
                        <p>Nulla consectetur ornare nibh, a auctor mauris scelerisque eu proin nec urna quis justo adipiscing auctor ut auctor. feugiat </p>
                    </div>
                    <div class="col-md-4 Ver">
                        <i class="fa fa-cog b-lazy" data-src="images/cir.png"></i>
                        <h4>Very Flexible</h4>
                        <p>Nulla consectetur ornare nibh, a auctor mauris scelerisque eu proin nec urna quis justo adipiscing auctor ut auctor. feugiat </p>
                    </div>
                    <div class="col-md-4 Fully">
                        <i class="fa fa-tablet b-lazy" data-src="images/cir.png"></i>
                        <h4>Fully Responsive</h4>
                        <p>Nulla consectetur ornare nibh, a auctor mauris scelerisque eu proin nec urna quis justo adipiscing auctor ut auctor. feugiat </p>
                    </div>      
                </div>
            </div>
        </div>
        <div class="container">
            <div class="row">
                <div class="col-md-12 wwa">
                    <span name="about" ></span>
                    <h3>Who We Are? Meet Our Team!</h3>
                    <h4>We listen, we discuss, we advise and develop. We love to learn and use the latest technologies.</h4>
                </div>
            </div>
        </div>
        <div class="container">
            <div class="row team">
                <div class="col-md-4 b1">
                    <img class="img-responsive b-lazy" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" data-src="images/picTeam/picT1.png" width="182" height="181" alt="Tom Simpson - CEO">
                    <h4>Tom Simpson</h4>
                    <h5>CEO</h5>
                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit <br/>quisque tempus ac eget diam et laoreet phasellus ut nisi id leo molestie. adipiscing vitae vel quam proin eget mauris eget.</p>
                    <ul>
                        <li><a href="#" aria-label="Facebook"><i class="fa fa-facebook-square"></i></a></li>
                        <li><a href="#" aria-label="Pinterest"><i class="fa fa-pinterest"></i></a></li>
                        <li><a href="#" aria-label="Twitter"><i class="fa fa-twitter" ></i></a></li>
                        <li><a href="#" aria-label="Google Plus"><i class="fa fa-google-plus-square"></i></a></li>
                    </ul>
                </div>

                <div class="col-md-4">
                    <img class="img-responsive b-lazy" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" data-src="images/picTeam/picT2.png" width="182" height="181" alt="John Doe - Project Manager">
                    <h4>John Doe</h4>
                    <h5>Project Manager</h5>
                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit<br/> quisque tempus ac eget diam et laoreet phasellus ut nisi id leo molestie. adipiscing vitae vel quam proin eget mauris eget.</p>
                    <ul>
                        <li><a href="#" aria-label="Facebook"><i class="fa fa-facebook-square"></i></a></li>
                        <li><a href="#" aria-label="Pinterest"><i class="fa fa-pinterest"></i></a></li>
                        <li><a href="#" aria-label="Twitter"><i class="fa fa-twitter" ></i></a></li>
                        <li><a href="#" aria-label="Google Plus"><i class="fa fa-google-plus-square"></i></a></li>
                    </ul>
                </div>

                <div class="col-md-4 b3">
                    <img class="img-responsive b-lazy" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" data-src="images/picTeam/picT3.png" width="182" height="181" alt="Anna White - Developer">
                    <h4>Anna White</h4>
                    <h5>Developer</h5>
                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit<br/> quisque tempus ac eget diam et laoreet phasellus ut nisi id leo molestie. adipiscing vitae vel quam proin eget mauris eget.</p>
                    <ul>
                        <li><a href="#" aria-label="Facebook"><i class="fa fa-facebook-square"></i></a></li>
                        <li><a href="#" aria-label="Pinterest"><i class="fa fa-pinterest"></i></a></li>
                        <li><a href="#" aria-label="Twitter"><i class="fa fa-twitter" ></i></a></li>
                        <li><a href="#" aria-label="Google Plus"><i class="fa fa-google-plus-square"></i></a></li>
                    </ul>
                </div>
            </div>
        </div>
        <div class="container">
            <div class="row">
                <div class="col-md-12 hr1">
                    <hr/>
                </div>
            </div>
        </div>      
        <div class="container">
            <div class="row">
                <div class="col-md-3 bar">
                    <div class="progB chart" data-percent="64"  data-animate="3500">
                        <div class="chart chart-content">
                            <div class="percentage" data-percent="64">
                              <span class="percent">64</span>
                            </div>
                        </div>
                    </div>
                    <div class="textP">
                        <h3>WordPress</h3>
                        <p>Nulla consectetur ornare nibh, a auctor <br/>mauris scelerisque eu proin nec urna quis. </p>
                    </div>
                </div>
                <div class="col-md-3 bar">
                    <div class="progB chart" data-percent="22"  data-animate="3500">
                        <div class="chart chart-content">
                            <div class="percentage" data-percent="22">
                              <span class="percent">22</span>
                            </div>
                        </div>
                    </div>
                    <div class="textP">
                        <h3>HTML5</h3>
                        <p>Nulla consectetur ornare nibh, a auctor <br/>mauris scelerisque eu proin nec urna quis. </p>
                    </div>
                </div>
                <div class="col-md-3 bar ">
                    <div class="progB chart" data-percent="84"  data-animate="3500">
                        <div class="chart chart-content">
                            <div class="percentage" data-percent="22">
                              <span class="percent">84</span>
                            </div>
                        </div>
                    </div>
                    <div class="textP">
                        <h3>CSS3</h3>
                        <p>Nulla consectetur ornare nibh, a auctor <br/>mauris scelerisque eu proin nec urna quis. </p>
                    </div>
                </div>
                <div class="col-md-3 bar ">
                    <div class="progB chart" data-percent="45"  data-animate="3500">
                        <div class="chart chart-content">
                            <div class="percentage" data-percent="45">
                              <span class="percent">45</span>
                            </div>
                        </div>
                    </div>
                    <div class="textP">
                        <h3>Woocommerce</h3>
                        <p>Nulla consectetur ornare nibh, a auctor <br/>mauris scelerisque eu proin nec urna quis. </p>
                    </div>
                </div>
            </div>
        </div>  
        
        
        <div class="container">
            <div class="row aboutUs">
                <div class="col-md-12 ">
                    <h3>What Our Customers Say About Us?</h3>
                </div>
            </div>
        </div>
        
        <div style="position: relative;">
        
            <div class="container">
                <div class="row about">
                    <div class="col-md-6">
                        <div class="about1">
                        <img class="pic1Ab b-lazy" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" data-src="images/picAbout/aboutP1.png" alt="Anna Smith testimonial">
                            <h3>Anna Smith, Company Inc.</h3>
                            <p>Nulla consectetur ornare nibh, a auctor mauris scelerisque eu proin nec urna quis justo adipiscing auctor ut auctor feugiat fermentum quisque eget pharetra, felis et venenatis. aliquam, nulla nisi lobortis elit ac.</p>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="about2">
                        <img class="pic2Ab b-lazy" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" data-src="images/picAbout/aboutP2.png" alt="John Doe testimonial">
                            <h3>John Doe, Company Inc.</h3>
                            <p>Consectetur ornare nibh, a auctor mauris scelerisque eu proin nec urna quis justo, adipiscing auctor, ut auctor feugiat fermentum nec quisque eget pharetra, felis et venenatis aliquam, nulla nisi lobortis elit, ac luctus.</p>
                        </div>
                    </div>
                </div>
            </div>
        
            <div class="horL"></div>
        
            <div class="container">
                <div class="row about">
                    <div class="col-md-6">
                        <div class="about1">
                        <img class="pic1Ab b-lazy" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" data-src="images/picAbout/aboutP3.png" alt="Tom Sawyer testimonial">
                            <h3>Tom Sawyer, Company Inc.</h3>
                            <p>A auctor mauris scelerisque eu proin nec urna quis justo adipiscing auctor ut auctor feugiat fermentum quisque eget pharetra, felis et venenatis aliquam, nulla nisi lobortis elit, acnterdum ante feugiat vitae.</p>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="about2">
                        <img class="pic2Ab b-lazy" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" data-src="images/picAbout/aboutP4.png" alt="Sarah White testimonial">
                            <h3>Sarah White, Company Inc.</h3>
                            <p>Ornare nibh a auctor, mauris scelerisque eu proin nec urna nec a quis justo adipiscing auctor ut auctor feugiat fermentum quisque eget pharetra felis et venenatis aliquam, nulla nisi lobortis elit, ac eleifend nisl ante nec lorem. </p>
                        </div>
                    </div>
                </div>
            </div>
        
        </div>
    </div>

    <!--project start-->

    <div id="project">      
        <div class="line3">
            <div class="container">
                <div id="project1" ></div>
                <div class="row Ama">
                    <div class="col-md-12">
                        <span name="projects" id="projectss"></span>
                        <h3>Our Amazing Works</h3>
                        <p>Right here we've got something you gonna love</p>
                    </div>
                </div>
            </div>
        </div>          

        <div class="container">
            <div class="row">
                <!-- filter_block -->
                <div id="options" class="col-md-12" style="text-align: center;">
                    <ul id="filter" class="option-set" data-option-key="filter">
                        <li><a class="selected" href="#" data-option-value="*" class="current">All Works</a></li>
                        <li><a href="#" data-option-value=".polygraphy">Polygraphy</a></li>
                        <li><a href="#" data-option-value=".branding">Branding</a></li>
                        <li><a href="#" data-option-value=".web">Web UI</a></li>
                        <li><a href="#" data-option-value=".text_styles">Text Styles</a></li>
                    </ul>
                </div>
                <!-- //filter_block -->
        
                <div class="portfolio_block columns3   pretty" data-animated="fadeIn">  
                    <div class="element col-sm-4   gall branding">
                        <a class="plS" href="images/prettyPhotoImages/pic1.jpg" rel="prettyPhoto[gallery2]">
                            <img class="img-responsive picsGall b-lazy" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" data-src="images/prettyPhotoImages/thumb_pic1.jpg" width="356" height="276" alt="pic1 Gallery"/>
                        </a>
                        <div class="view project_descr ">
                            <h3><a href="#">Recycled Paper - Business Card Mock Up</a></h3>
                            <ul>
                                <li><i class="fa fa-eye"></i>215</li>
                                <li><a class="heart" href="#"><i class="fa-heart-o"></i>14</a></li>
                            </ul>
                        </div>
                    </div>
                    <div class="element col-sm-4  gall branding">
                        <a class="plS" href="images/prettyPhotoImages/pic2.jpg" rel="prettyPhoto[gallery2]">
                            <img class="img-responsive picsGall b-lazy" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" data-src="images/prettyPhotoImages/thumb_pic2.jpg" width="356" height="276" alt="pic2 Gallery"/>
                        </a>
                        <div class="view project_descr center">
                            <h3><a href="#">Environment Logos Set</a></h3>
                            <ul>
                                <li><i class="fa fa-eye"></i>369</li>
                                <li><a  class="heart" href="#"><i class="fa-heart-o"></i>86</a></li>
                            </ul>
                        </div>
                    </div>
                    <div class="element col-sm-4  gall web">
                        <a class="plS" href="images/prettyPhotoImages/pic3.jpg" rel="prettyPhoto[gallery2]">
                            <img class="img-responsive picsGall b-lazy" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" data-src="images/prettyPhotoImages/thumb_pic3.jpg" width="356" height="276" alt="pic3 Gallery"/>
                        </a>
                        <div class="view project_descr ">
                            <h3><a href="#">Beag Simple WEB UI</a></h3>
                            <ul>
                                <li><i class="fa fa-eye"></i>400</li>
                                <li><a  class="heart" href="#"><i class="fa-heart-o"></i>124</a></li>
                            </ul>
                        </div>
                    </div>
        
        
                    
                    <div class="element col-sm-4  gall  text_styles">
                        <a class="plS" href="images/prettyPhotoImages/pic4.jpg" rel="prettyPhoto[gallery2]">
                            <img class="img-responsive picsGall b-lazy" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" data-src="images/prettyPhotoImages/thumb_pic4.jpg" width="356" height="276" alt="pic1 Gallery"/>
                        </a>
                        <div class="view project_descr ">
                            <h3><a href="#">Pop Candy Text Effect</a></h3>
                            <ul>
                                <li><i class="fa fa-eye"></i>480</li>
                                <li><a  class="heart" href="#"><i class="fa-heart-o"></i>95</a></li>
                            </ul>
                        </div>
                    </div>
                    <div class="element col-sm-4  gall  web">
                        <a class="plS" href="images/prettyPhotoImages/pic5.jpg" rel="prettyPhoto[gallery2]">
                            <img class="img-responsive picsGall b-lazy" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" data-src="images/prettyPhotoImages/thumb_pic5.jpg" width="356" height="276" alt="pic1 Gallery"/>
                        </a>
                        <div class="view project_descr center">
                            <h3><a href="#">User Interface Elements</a></h3>
                            <ul>
                                <li><i class="fa fa-eye"></i>215</li>
                                <li><a  class="heart" href="#"><i class="fa-heart-o"></i>14</a></li>
                            </ul>
                        </div>
                    </div>
                    <div class="element col-sm-4  gall  polygraphy">
                        <a class="plS" href="images/prettyPhotoImages/pic6.jpg" rel="prettyPhoto[gallery2]">
                            <img class="img-responsive picsGall b-lazy" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" data-src="images/prettyPhotoImages/thumb_pic6.jpg" width="356" height="276" alt="pic1 Gallery"/>
                        </a>
                        <div class="view project_descr ">
                            <h3><a href="#">Stationery Branding Mock Up</a></h3>
                            <ul>
                                <li><i class="fa fa-eye"></i>375</li>
                                <li><a  class="heart" href="#"><i class="fa-heart-o"></i>102</a></li>
                            </ul>
                        </div>
                    </div>      
                    <div class="element col-sm-4   gall branding">
                        <a class="plS" href="images/prettyPhotoImages/pic7.jpg" rel="prettyPhoto[gallery2]">
                            <img class="img-responsive picsGall b-lazy" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" data-src="images/prettyPhotoImages/thumb_pic7.jpg" width="356" height="276" alt="pic1 Gallery"/>
                        </a>
                        <div class="view project_descr ">
                            <h3><a href="#">Darko - Business Card Mock Up</a></h3>
                            <ul>
                                <li><i class="fa fa-eye"></i>440</li>
                                <li><a  class="heart" href="#"><i class="fa-heart-o"></i>35</a></li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="element col-sm-4  gall text_styles">
                        <a class="plS" href="images/prettyPhotoImages/pic8.jpg" rel="prettyPhoto[gallery2]">
                            <img class="img-responsive picsGall b-lazy" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" data-src="images/prettyPhotoImages/thumb_pic8.jpg" width="356" height="276" alt="pic1 Gallery"/>
                        </a>
                        <div class="view project_descr ">
                            <h3><a href="#">Foil Mini Badges</a></h3>
                            <ul>
                                <li><i class="fa fa-eye"></i>512</li>
                                <li><a  class="heart" href="#"><i class="fa-heart-o"></i>36</a></li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="element col-sm-4  gall polygraphy">
                        <a class="plS" href="images/prettyPhotoImages/pic9.jpg" rel="prettyPhoto[gallery2]">
                            <img class="img-responsive picsGall b-lazy" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" data-src="images/prettyPhotoImages/thumb_pic9.jpg" width="356" height="276" alt="pic1 Gallery"/>
                        </a>
                        <div class="view project_descr ">
                            <h3><a href="#">Woody Poster Text Effect</a></h3>
                            <ul>
                                <li><i class="fa fa-eye"></i>693</li>
                                <li><a  class="heart" href="#"><i class="fa-heart-o"></i>204</a></li>
                            </ul>
                        </div>
                    </div>          
                </div>

                <div class="col-md-12 cBtn  lb" style="text-align: center;">
                    <ul class="load_more_cont ">
                        <li class="dowbload btn_load_more">
                            <a href="javascript:void(0);" >
                                <i class="fa fa-arrow-down"></i>Load More Projects
                            </a>
                        </li>
                        <li class="buy">
                            <a href="#">
                                <i class="fa fa-shopping-cart"></i>Buy on Themeforest
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>    
    
    <!--news start-->
    
    <div id="news">
        <div class="line4">     
            <div class="container">
                <div class="row Ama">
                    <div class="col-md-12">
                        <h3>What&rsquo;s New?</h3>
                        <p>Get the latest news from our blog</p>
                    </div>
                </div>
            </div>
        </div>
        <div class="container">
            <div class="row news">
                <div class="col-md-6  text-left">
                    <img class="img-responsive picsGall b-lazy" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" data-src="images/picNews/news1.jpg" width="560" height="396" alt="News article image"/>
                    <h3><a href="#">Lorem Ipsum Dolor sit Amet Pelenntesque Sodales!</a></h3>
                    <ul>
                        <li><i class="fa fa-calendar"></i>April 25, 2014</li>
                        <li><a href="#"><i class="fa fa-folder-open"></i>Staff</a></li>
                        <li><a href="#"><i class="fa fa-comments"></i>17 comments</a></li>
                    </ul>
                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit quisque tempus ac eget diam et laoreet phasellus ut nisi id leo molestie. adipiscing vitae vel quam proin eget mauris eget. <a class="readMore" href="#">Read More <i class="fa fa-angle-right"></i></a></p>
                    <hr class="hrNews">
                </div>
                <div class="col-md-6 text-right">
                    <img class="img-responsive picsGall b-lazy" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" data-src="images/picNews/news2.jpg" width="560" height="396" alt="News article image"/>
                    <h3><a href="#">Nam in Nisl id Ipsum Feugiat Posuere ut sit Amet Sem</a></h3>
                    <ul>
                        <li><i class="fa fa-calendar"></i>April 25, 2014</li>
                        <li><a href="#"><i class="fa fa-folder-open"></i>Staff</a></li>
                        <li><a href="#"><i class="fa fa-comments"></i>17 comments</a></li>
                    </ul>
                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit quisque tempus ac eget diam et laoreet phasellus ut nisi id leo molestie. adipiscing vitae vel quam proin eget mauris eget. <a class="readMore" href="#">Read More <i class="fa fa-angle-right"></i></a></p>
                    <hr class="hrNews">
                </div>
            </div>
        </div>
        <div class="container">
            <div class="row news2 news">
                <div class="col-md-6 text-left">
                    <img class="img-responsive picsGall b-lazy" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" data-src="images/picNews/news3.jpg" width="560" height="396" alt="News article image"/>
                    <h3><a href="#">Lorem Ipsum Dolor sit Amet Pelenntesque Sodales!</a></h3>
                    <ul>
                        <li><i class="fa fa-calendar"></i>April 25, 2014</li>
                        <li><a href="#"><i class="fa fa-folder-open"></i>Staff</a></li>
                        <li><a href="#"><i class="fa fa-comments"></i>17 comments</a></li>
                    </ul>
                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit quisque tempus ac eget diam et laoreet phasellus ut nisi id leo molestie. adipiscing vitae vel quam proin eget mauris eget. <a class="readMore" href="#">Read More <i class="fa fa-angle-right"></i></a></p>
                    <hr class="hrNews">
                </div>
                <div class="col-md-6 text-right">
                    <img class="img-responsive picsGall b-lazy" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" data-src="images/picNews/news4.jpg" width="560" height="396" alt="News article image"/>
                    <h3><a href="#">Nam in Nisl id Ipsum Feugiat Posuere ut sit Amet Sem</a></h3>
                    <ul>
                        <li><i class="fa fa-calendar"></i>April 25, 2014</li>
                        <li><a href="#"><i class="fa fa-folder-open"></i>Staff</a></li>
                        <li><a href="#"><i class="fa fa-comments"></i>17 comments</a></li>
                    </ul>
                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit quisque tempus ac eget diam et laoreet phasellus ut nisi id leo molestie. adipiscing vitae vel quam proin eget mauris eget. <a class="readMore" href="#">Read More <i class="fa fa-angle-right"></i></a></p>
                    <hr class="hrNews">
                </div>
            </div>
        </div>
        <div class="container">
            <div class="row news2 news">
                <div class="col-md-6 text-left">
                    <img class="img-responsive picsGall b-lazy" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" data-src="images/picNews/news5.jpg" width="560" height="396" alt="News article image"/>
                    <h3 ><a href="#">Lorem Ipsum Dolor sit Amet Pelenntesque Sodales!</a></h3>
                    <ul>
                        <li><i class="fa fa-calendar"></i>April 25, 2014</li>
                        <li><a href="#"><i class="fa fa-folder-open"></i>Staff</a></li>
                        <li><a href="#"><i class="fa fa-comments"></i>17 comments</a></li>
                    </ul>
                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit quisque tempus ac eget diam et laoreet phasellus ut nisi id leo molestie. adipiscing vitae vel quam proin eget mauris eget. <a class="readMore" href="#">Read More <i class="fa fa-angle-right"></i></a></p>
                    <hr class="hrNews">
                </div>
                <div class="col-md-6 text-right">
                    <img class="img-responsive picsGall b-lazy" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" data-src="images/picNews/news6.jpg" width="560" height="396" alt="News article image"/>
                    <h3><a href="#">Nam in Nisl id Ipsum Feugiat Posuere ut sit Amet Sem</a></h3>
                    <ul>
                        <li><i class="fa fa-calendar"></i>April 25, 2014</li>
                        <li><a href="#"><i class="fa fa-folder-open"></i>Staff</a></li>
                        <li><a href="#"><i class="fa fa-comments"></i>17 comments</a></li>
                    </ul>
                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit quisque tempus ac eget diam et laoreet phasellus ut nisi id leo molestie. adipiscing vitae vel quam proin eget mauris eget. <a class="readMore" href="#">Read More <i class="fa fa-angle-right"></i></a></p>
                    <hr class="hrNews">
                </div>
            </div>
        </div>

        <div class="container hideObj2" style="display:none;">
            <div class="row news2 news">
                <div class="col-md-6 text-right">
                    <img class="img-responsive picsGall b-lazy" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" data-src="images/picNews/news6.jpg" width="560" height="396" alt="News article image"/>
                    <h3><a href="#">Nam in Nisl id Ipsum Feugiat Posuere ut sit Amet Sem</a></h3>
                    <ul>
                        <li><i class="fa fa-calendar"></i>April 25, 2014</li>
                        <li><a href="#"><i class="fa fa-folder-open"></i>Staff</a></li>
                        <li><a href="#"><i class="fa fa-comments"></i>17 comments</a></li>
                    </ul>
                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit quisque tempus ac eget diam et laoreet phasellus ut nisi id leo molestie. adipiscing vitae vel quam proin eget mauris eget. <a class="readMore" href="#">Read More <i class="fa fa-angle-right"></i></a></p>
                    <hr class="hrNews">
                </div>
                <div class="col-md-6 text-left">
                    <img class="img-responsive picsGall b-lazy" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" data-src="images/picNews/news5.jpg" width="560" height="396" alt="News article image"/>
                    <h3><a href="#">Lorem Ipsum Dolor sit Amet Pelenntesque Sodales!</a></h3>
                    <ul>
                        <li><i class="fa fa-calendar"></i>April 25, 2014</li>
                        <li><a href="#"><i class="fa fa-folder-open"></i>Staff</a></li>
                        <li><a href="#"><i class="fa fa-comments"></i>17 comments</a></li>
                    </ul>
                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit quisque tempus ac eget diam et laoreet phasellus ut nisi id leo molestie. adipiscing vitae vel quam proin eget mauris eget. <a class="readMore" href="#">Read More <i class="fa fa-angle-right"></i></a></p>
                    <hr class="hrNews">
                </div>
            </div>
        </div>
        <div class="container">
            <div class="row cBtn">
                <div class="col-md-12" style="text-align: center; margin-bottom: -90px; z-index: 10;">
                    <ul class="mNews">
                        <li class="dowbload bhide2"><a href="#"><i class="fa fa-arrow-down"></i>Load More news</a></li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
    
    
    <!--contact start-->
    
    <div id="contact">
        <div class="line5">                 
            <div class="container">
                <div class="row Ama">
                    <div class="col-md-12">
                    <h3>Got a Question? We&rsquo;re Here to Help!</h3>
                    <p>Get in touch with us</p>
                    </div>
                </div>
            </div>
        </div>
        <div class="container">
            <div class="row">
                <div class="col-md-9 col-xs-12 forma">
                    <form>
                        <input type="text" class="col-md-6 col-xs-12 name" name='name' placeholder='Name *'/>
                        <input type="text" class="col-md-6 col-xs-12 Email" name='Email' placeholder='Email *'/>
                        <input type="text" class="col-md-12 col-xs-12 Subject" name='Subject' placeholder='Subject'/>
                        <textarea type="text" class="col-md-12 col-xs-12 Message" name='Message' placeholder='Message *'></textarea>
                        <div class="cBtn col-xs-12">
                            <ul>
                                <li class="clear"><a href="#"><i class="fa fa-times"></i>clear form</a></li>
                                <li class="send"><a href="#"><i class="fa fa-share"></i>Send Message</a></li>
                            </ul>
                        </div>
                    </form>
                </div>
                <div class="col-md-3 col-xs-12 cont">
                    <ul>
                        <li><i class="fa fa-home"></i>5512 Lorem Ipsum Vestibulum 666/13</li>
                        <li><i class="fa fa-phone"></i>+1 800 789 50 12, +1 800 450 6935</li>
                        <li><a href="#"><i class="fa fa-envelope"></i>mail@compname.com</li></a>
                        <li><i class="fa fa-skype"></i>compname</li>
                        <li><a href="#"><i class="fa fa-twitter"></i>Twitter</li></a>
                        <li><a href="#"><i class="fa fa-facebook-square"></i>Facebook</li></a>
                        <li><a href="#"><i class="fa fa-dribbble"></i>Dribbble</li></a>
                        <li><a href="#"><i class="fa fa-flickr"></i>Flickr</li></a>
                        <li><a href="#"><i class="fa fa-youtube-play"></i>YouTube</li></a>
                    </ul>
                </div>
            </div>
        </div>
        <div class="line6">
            <div id="map" class="b-lazy" data-src="images/mapStaticLeaf.webp" style="width:100%; height:700px; background-size: cover; background-position: center center; background-repeat: no-repeat;"></div>
        </div>
        <div class="container">
            <div class="row ftext">
                <div class="col-md-12">
                    <a id="features"></a>
                    <h3>We Care About Our Clients and Can Make Their Life Easier!</h3>
                    <p>The main peculiarity of template is the striking presentation when visitors just need to use the scrolling option to find all necessary information about your web project. </p>
                </div>
                <div class="cBtn">
                    <ul style="margin-top: 23px; margin-bottom: 0px; padding-left: 26px;">
                        <li class="dowbload"><a href="#"><i class="fa fa-star"></i>View All Features</a></li>
                        <li class="buy"><a href="#"><i class="fa fa-download"></i>Buy This Template</a></li>
                    </ul>
                </div>
            </div>
        </div>
        <div class="line7 b-lazy" data-src="images/line7Bg.jpg">
            <div class="container">
                <div class="row footer">
                    <div class="col-md-12">
                        <h3>Subscribe for Our Newsletter!</h3>
                        <p>Subscribe to our newsletter email to get notification about fresh news, latest promos, giveaways and free stuff from Skew. Stay always up-to-date!</p>
                        <div class="fr">
                        <div style="display: inline-block;">
                            <input class="col-md-6 fEmail" name='Email' placeholder='Enter Your Email'/>
                            <a href="#" class="subS">Subscribe!</a>
                        </div>
                        </div>
                    </div>
                    <div class="soc col-md-12">
                        <ul>
                            <li class="soc1"><a class="b-lazy" data-src="images/socIcons.png" href="#"></a></li>
                            <li class="soc2"><a class="b-lazy" data-src="images/socIcons.png" href="#"></a></li>
                            <li class="soc3"><a class="b-lazy" data-src="images/socIcons.png" href="#"></a></li>
                            <li class="soc4"><a class="b-lazy" data-src="images/socIcons.png" href="#"></a></li>
                            <li class="soc5"><a class="b-lazy" data-src="images/socIcons.png" href="#"></a></li>
                            <li class="soc6"><a class="b-lazy" data-src="images/socIcons.png" href="#"></a></li>
                            <li class="soc7"><a class="b-lazy" data-src="images/socIcons.png" href="#"></a></li>
                            <li class="soc8"><a class="b-lazy" data-src="images/socIcons.png" href="#"></a></li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
        <div class="lineBlack">
            <div class="woodWedge b-lazy" data-src="images/bgBeforFooter.jpg"></div>
            <div class="container">
                <div class="row downLine">
                    <div class="col-md-12 text-right">
                        <input  id="searchPattern" type="search" placeholder="Search the Site"/><i class="glyphicon glyphicon-search" style="font-size: 13px; color:#a5a5a5;" id="iS"></i>
                    </div>
                    <div class="col-md-6 text-left copy">
                        <p>Copyright &copy; 2014 Timber HTML Template. All Rights Reserved.</p>
                    </div>
                    <div class="col-md-6 text-right dm">
                        <ul id="downMenu">
                            <li class="active"><a href="#home">Home</a></li>
                            <li><a href="#about">About</a></li>
                            <li><a href="#project1">Projects</a></li>
                            <li><a href="#news">News</a></li>
                            <li class="last"><a href="#contact">Contact</a></li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>      

</body>
</html>