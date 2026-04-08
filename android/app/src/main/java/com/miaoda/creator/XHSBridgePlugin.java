package com.miaoda.creator;

import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "XHSBridge")
public class XHSBridgePlugin extends Plugin {
    private static final String XHS_PACKAGE_NAME = "com.xingin.xhs";
    private static final String XHS_SCHEME = "xhsdiscover://";

    @PluginMethod
    public void isXHSInstalled(PluginCall call) {
        JSObject result = new JSObject();
        result.put("installed", canOpenXHS());
        call.resolve(result);
    }

    @PluginMethod
    public void openXHS(PluginCall call) {
        JSObject result = new JSObject();
        boolean opened = openXHSInternal();
        result.put("opened", opened);

        if (opened) {
            call.resolve(result);
            return;
        }

        call.reject("Xiaohongshu app is not installed or cannot be opened");
    }

    private boolean canOpenXHS() {
        PackageManager packageManager = getContext().getPackageManager();
        Intent launchIntent = packageManager.getLaunchIntentForPackage(XHS_PACKAGE_NAME);
        if (launchIntent != null) {
            return true;
        }

        Intent schemeIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(XHS_SCHEME));
        schemeIntent.setPackage(XHS_PACKAGE_NAME);
        return schemeIntent.resolveActivity(packageManager) != null;
    }

    private boolean openXHSInternal() {
        PackageManager packageManager = getContext().getPackageManager();
        Intent launchIntent = packageManager.getLaunchIntentForPackage(XHS_PACKAGE_NAME);
        if (launchIntent != null) {
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(launchIntent);
            return true;
        }

        Intent schemeIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(XHS_SCHEME));
        schemeIntent.setPackage(XHS_PACKAGE_NAME);
        schemeIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

        if (schemeIntent.resolveActivity(packageManager) == null) {
            return false;
        }

        getContext().startActivity(schemeIntent);
        return true;
    }
}
