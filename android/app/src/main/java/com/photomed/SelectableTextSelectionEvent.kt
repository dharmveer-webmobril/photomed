package com.photomedPro.com

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event

class SelectableTextSelectionEvent(
    viewId: Int,
    private val eventType: String,
    private val content: String
) : Event<SelectableTextSelectionEvent>(viewId) {

    companion object {
        const val EVENT_NAME = "topSelection"
    }
    
    override fun getEventName(): String {
        return EVENT_NAME
    }

    override fun getEventData(): WritableMap {
        val eventData = Arguments.createMap()
        eventData.putString("eventType", eventType)
        eventData.putString("content", content)
        return eventData
    }
}

