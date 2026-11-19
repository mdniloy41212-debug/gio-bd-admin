package com.giobd.admin;

import android.Manifest;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import com.getcapacitor.JSObject;

@CapacitorPlugin(
    name = "MicrophonePermission",
    permissions = {
        @Permission(alias = "microphone", strings = { Manifest.permission.RECORD_AUDIO })
    }
)
public class MicrophonePermissionPlugin extends Plugin {
    @PluginMethod
    public void request(PluginCall call) {
        if (getPermissionState("microphone") == PermissionState.GRANTED) {
            JSObject result = new JSObject();
            result.put("granted", true);
            call.resolve(result);
            return;
        }
        requestPermissionForAlias("microphone", call, "microphonePermissionCallback");
    }

    @PermissionCallback
    private void microphonePermissionCallback(PluginCall call) {
        JSObject result = new JSObject();
        boolean granted = getPermissionState("microphone") == PermissionState.GRANTED;
        result.put("granted", granted);
        call.resolve(result);
    }
}
