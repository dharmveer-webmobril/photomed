package com.photomedPro.com

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.common.MapBuilder
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerModule
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.events.EventDispatcher

class SelectableTextViewManager : SimpleViewManager<SelectableTextView>() {

    companion object {
        const val REACT_CLASS = "RCTSelectableTextView"
        const val EVENT_SELECTION = "topSelection"
    }

    override fun getName(): String {
        return REACT_CLASS
    }
    
    override fun getExportedCustomBubblingEventTypeConstants(): Map<String, Any>? {
        return MapBuilder.builder<String, Any>()
            .put(
                EVENT_SELECTION,
                MapBuilder.of("phasedRegistrationNames", MapBuilder.of("bubbled", "onSelection"))
            )
            .build()
    }

    override fun createViewInstance(reactContext: ThemedReactContext): SelectableTextView {
        val view = SelectableTextView(reactContext)
        val eventDispatcher = reactContext.getNativeModule(UIManagerModule::class.java)?.eventDispatcher
        
        view.onSelectionCallback = { eventType, content ->
            eventDispatcher?.dispatchEvent(
                SelectableTextSelectionEvent(view.id, eventType, content)
            )
        }
        
        return view
    }

    @ReactProp(name = "text")
    fun setText(view: SelectableTextView, text: String?) {
        view.text = text ?: ""
    }

    @ReactProp(name = "menuItems")
    fun setMenuItems(view: SelectableTextView, menuItems: ReadableArray?) {
        // Menu items are handled in the custom action mode callback
        // This prop is kept for API consistency with iOS
    }
}

