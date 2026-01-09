package com.photomedPro.com

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.events.RCTEventEmitter

class SelectableTextViewManager : SimpleViewManager<SelectableTextView>() {

    companion object {
        const val REACT_CLASS = "RCTSelectableTextView"
    }

    override fun getName(): String {
        return REACT_CLASS
    }

    override fun createViewInstance(reactContext: ThemedReactContext): SelectableTextView {
        val view = SelectableTextView(reactContext)
        
        view.onSelectionCallback = { eventType, content ->
            val event: WritableMap = Arguments.createMap().apply {
                putString("eventType", eventType)
                putString("content", content)
            }
            
            reactContext
                .getNativeModule(RCTEventEmitter::class.java)
                ?.receiveEvent(view.id, "onSelection", event)
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

