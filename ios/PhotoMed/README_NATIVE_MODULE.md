# Native Module Setup Instructions

## Adding Native Files to Xcode Project

To fix the `viewConfig.bubblingEventTypes` error, you need to add the native module files to your Xcode project:

### Steps:

1. Open `ios/PhotoMed.xcworkspace` (NOT .xcodeproj) in Xcode
2. In the Project Navigator, right-click on the `PhotoMed` folder (the blue folder, not the yellow one)
3. Select **"Add Files to PhotoMed..."**
4. Navigate to `ios/PhotoMed/` directory
5. Select these 4 files:
   - `RCTSelectableTextView.h`
   - `RCTSelectableTextView.m`
   - `RCTSelectableTextViewManager.h`
   - `RCTSelectableTextViewManager.m`
6. **Important**: Make sure:
   - ✅ "Copy items if needed" is **UNCHECKED**
   - ✅ "Add to targets: PhotoMed" is **CHECKED**
   - ✅ "Create groups" is selected (not "Create folder references")
7. Click "Add"

### Verify the Files are Added:

1. In Xcode, select the `PhotoMed` project in the navigator
2. Select the `PhotoMed` target
3. Go to "Build Phases" tab
4. Expand "Compile Sources"
5. Verify you see:
   - `RCTSelectableTextView.m`
   - `RCTSelectableTextViewManager.m`

### Clean and Rebuild:

1. In Xcode: Product → Clean Build Folder (Shift+Cmd+K)
2. Close Xcode
3. In terminal, run:
   ```bash
   cd ios
   pod install
   cd ..
   ```
4. Rebuild the app

### If Still Getting Errors:

1. Make sure you're opening `.xcworkspace` not `.xcodeproj`
2. Check that the files are in the correct location: `ios/PhotoMed/`
3. Verify the module name matches: `RCTSelectableTextView`
4. Try deleting `ios/build` folder and rebuilding

