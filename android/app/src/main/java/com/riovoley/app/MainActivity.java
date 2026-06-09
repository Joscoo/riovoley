package com.riovoley.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
	@Override
	public void onCreate(android.os.Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);

		// If the app will perform APK installs (sideloading), ensure the user
		// has granted the "install unknown apps" permission for this app.
		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
			boolean canInstall = getPackageManager().canRequestPackageInstalls();
			if (!canInstall) {
				// Open system settings so the user can allow installs from this app.
				Intent intent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
						Uri.parse("package:" + getPackageName()));
				intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
				startActivity(intent);
			}
		}
	}
}
