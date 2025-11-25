<?php

namespace App\View\Components;

use Illuminate\View\Component;
use Skybolt\Skybolt as SkyboltLib;

class Skybolt extends Component
{
    private static ?SkyboltLib $instance = null;

    /**
     * Get the singleton Skybolt instance
     */
    public static function instance(): SkyboltLib
    {
        if (self::$instance === null) {
            $renderMapPath = public_path('build/.skybolt/render-map.json');
            self::$instance = new SkyboltLib($renderMapPath);
        }
        return self::$instance;
    }

    public function render()
    {
        return '';
    }

    /**
     * Render CSS asset
     */
    public static function css(string $entry): string
    {
        return self::instance()->css($entry);
    }

    /**
     * Render JavaScript asset
     */
    public static function script(string $entry, bool $module = true): string
    {
        return self::instance()->script($entry, $module);
    }

    /**
     * Render launch script
     */
    public static function launchScript(): string
    {
        return self::instance()->launchScript();
    }

    /**
     * Get asset URL
     */
    public static function assetUrl(string $entry): ?string
    {
        return self::instance()->getAssetUrl($entry);
    }
}
