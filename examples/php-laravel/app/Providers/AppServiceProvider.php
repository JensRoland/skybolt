<?php

namespace App\Providers;

use Illuminate\Support\Facades\Blade;
use Illuminate\Support\ServiceProvider;
use Skybolt\Skybolt;

class AppServiceProvider extends ServiceProvider
{
    private static ?Skybolt $skybolt = null;

    /**
     * Get the singleton Skybolt instance.
     */
    private static function skybolt(): Skybolt
    {
        if (self::$skybolt === null) {
            self::$skybolt = new Skybolt(public_path('build/.skybolt/render-map.json'));
        }
        return self::$skybolt;
    }

    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // @skyboltCss('path/to/file.css')
        Blade::directive('skyboltCss', function (string $expression) {
            return "<?php echo \App\Providers\AppServiceProvider::css({$expression}); ?>";
        });

        // @skyboltScript('path/to/file.js')
        Blade::directive('skyboltScript', function (string $expression) {
            return "<?php echo \App\Providers\AppServiceProvider::script({$expression}); ?>";
        });

        // @skyboltLaunch
        Blade::directive('skyboltLaunch', function () {
            return "<?php echo \App\Providers\AppServiceProvider::launchScript(); ?>";
        });

        // @skyboltVersion
        Blade::directive('skyboltVersion', function () {
            return "<?php echo \Skybolt\Skybolt::VERSION; ?>";
        });
    }

    /**
     * Render CSS asset (called by directive).
     */
    public static function css(string $entry): string
    {
        return self::skybolt()->css($entry);
    }

    /**
     * Render JavaScript asset (called by directive).
     */
    public static function script(string $entry, bool $module = true): string
    {
        return self::skybolt()->script($entry, $module);
    }

    /**
     * Render launch script (called by directive).
     */
    public static function launchScript(): string
    {
        return self::skybolt()->launchScript();
    }
}
