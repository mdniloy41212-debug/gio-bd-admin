package com.giobd.admin;

import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageInfo;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.Settings;
import android.widget.Toast;

import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;

@CapacitorPlugin(name = "AppUpdate")
public class AppUpdatePlugin extends Plugin {
    private long pendingDownloadId = -1L;
    private BroadcastReceiver downloadReceiver;

    @Override
    public void load() {
        downloadReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if (!DownloadManager.ACTION_DOWNLOAD_COMPLETE.equals(intent.getAction())) return;
                long completedId = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1L);
                if (completedId != pendingDownloadId) return;
                pendingDownloadId = -1L;
                openDownloadedApk(context, completedId);
            }
        };
        ContextCompat.registerReceiver(
            getContext(),
            downloadReceiver,
            new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE),
            ContextCompat.RECEIVER_NOT_EXPORTED
        );
    }

    @PluginMethod
    public void getAppVersion(PluginCall call) {
        JSObject result = new JSObject();
        try {
            PackageInfo packageInfo = getContext().getPackageManager()
                .getPackageInfo(getContext().getPackageName(), 0);
            long versionCode = Build.VERSION.SDK_INT >= Build.VERSION_CODES.P
                ? packageInfo.getLongVersionCode()
                : packageInfo.versionCode;
            result.put("versionCode", versionCode);
            result.put("versionName", packageInfo.versionName);
            call.resolve(result);
        } catch (Exception error) {
            call.reject("অ্যাপের ভার্সন পড়া যায়নি: " + error.getMessage(), error);
        }
    }

    @PluginMethod
    public void installUpdate(PluginCall call) {
        String apkUrl = call.getString("apkUrl");
        if (apkUrl == null || !apkUrl.startsWith("https://github.com/") ||
            !apkUrl.contains("/releases/latest/download/")) {
            call.reject("নিরাপদ APK ডাউনলোড লিংক পাওয়া যায়নি।");
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
            !getContext().getPackageManager().canRequestPackageInstalls()) {
            Intent settingsIntent = new Intent(
                Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                Uri.parse("package:" + getContext().getPackageName())
            );
            settingsIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(settingsIntent);
            call.reject("এই অ্যাপের জন্য Install unknown apps অনুমতি চালু করুন, তারপর আবার Update চাপুন।");
            return;
        }

        try {
            File destination = new File(
                getContext().getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS),
                "GIO-BD-Owner-update.apk"
            );
            if (destination.exists()) destination.delete();

            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(apkUrl));
            request.setTitle("GIO BD Owner আপডেট");
            request.setDescription("নতুন সংস্করণ ডাউনলোড হচ্ছে");
            request.setMimeType("application/vnd.android.package-archive");
            request.setAllowedOverMetered(true);
            request.setAllowedOverRoaming(false);
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            request.setDestinationInExternalFilesDir(
                getContext(), Environment.DIRECTORY_DOWNLOADS, "GIO-BD-Owner-update.apk"
            );

            DownloadManager manager = (DownloadManager) getContext().getSystemService(Context.DOWNLOAD_SERVICE);
            pendingDownloadId = manager.enqueue(request);

            JSObject result = new JSObject();
            result.put("downloadId", pendingDownloadId);
            result.put("message", "APK download started");
            call.resolve(result);
        } catch (Exception error) {
            call.reject("APK ডাউনলোড শুরু করা যায়নি: " + error.getMessage(), error);
        }
    }

    private void openDownloadedApk(Context context, long downloadId) {
        DownloadManager manager = (DownloadManager) context.getSystemService(Context.DOWNLOAD_SERVICE);
        DownloadManager.Query query = new DownloadManager.Query().setFilterById(downloadId);
        try (Cursor cursor = manager.query(query)) {
            if (cursor == null || !cursor.moveToFirst()) {
                Toast.makeText(context, "আপডেট ডাউনলোড যাচাই করা যায়নি।", Toast.LENGTH_LONG).show();
                return;
            }
            int statusIndex = cursor.getColumnIndex(DownloadManager.COLUMN_STATUS);
            if (statusIndex < 0 || cursor.getInt(statusIndex) != DownloadManager.STATUS_SUCCESSFUL) {
                Toast.makeText(context, "আপডেট ডাউনলোড ব্যর্থ হয়েছে। আবার চেষ্টা করুন।", Toast.LENGTH_LONG).show();
                return;
            }
        } catch (Exception error) {
            Toast.makeText(context, "ডাউনলোড পরীক্ষা করা যায়নি।", Toast.LENGTH_LONG).show();
            return;
        }

        try {
            File apkFile = new File(
                context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS),
                "GIO-BD-Owner-update.apk"
            );
            Uri apkUri = FileProvider.getUriForFile(
                context, context.getPackageName() + ".fileprovider", apkFile
            );
            Intent installIntent = new Intent(Intent.ACTION_VIEW);
            installIntent.setDataAndType(apkUri, "application/vnd.android.package-archive");
            installIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_GRANT_READ_URI_PERMISSION);
            context.startActivity(installIntent);
        } catch (Exception error) {
            Toast.makeText(context, "ইনস্টলার খোলা যায়নি: " + error.getMessage(), Toast.LENGTH_LONG).show();
        }
    }
}
