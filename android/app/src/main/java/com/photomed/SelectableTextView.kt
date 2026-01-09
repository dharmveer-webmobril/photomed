package com.photomedPro.com

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.util.AttributeSet
import android.view.ActionMode
import android.view.Menu
import android.view.MenuItem
import android.widget.TextView

class SelectableTextView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : TextView(context, attrs, defStyleAttr) {

    var onSelectionCallback: ((String, String) -> Unit)? = null

    init {
        // Enable text selection
        setTextIsSelectable(true)
        isFocusable = true
        isFocusableInTouchMode = true
        
        // Set custom action mode callback to handle copy
        customSelectionActionModeCallback = object : ActionMode.Callback {
            override fun onCreateActionMode(mode: ActionMode?, menu: Menu?): Boolean {
                // Clear default menu items
                menu?.clear()
                // Add Copy menu item
                menu?.add(0, android.R.id.copy, 0, "Copy")
                    ?.setShowAsAction(MenuItem.SHOW_AS_ACTION_IF_ROOM)
                return true
            }

            override fun onPrepareActionMode(mode: ActionMode?, menu: Menu?): Boolean {
                return false
            }

            override fun onActionItemClicked(mode: ActionMode?, item: MenuItem?): Boolean {
                if (item?.itemId == android.R.id.copy) {
                    val selectedText = getSelectedText()?.toString() ?: ""
                    if (selectedText.isNotEmpty()) {
                        // Copy to clipboard
                        val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                        val clip = ClipData.newPlainText("text", selectedText)
                        clipboard.setPrimaryClip(clip)
                        
                        // Send event to React Native
                        onSelectionCallback?.invoke("Copy", selectedText)
                        
                        mode?.finish()
                        return true
                    }
                }
                return false
            }

            override fun onDestroyActionMode(mode: ActionMode?) {
                // Cleanup if needed
            }
        }
    }

    override fun onTextChanged(text: CharSequence?, start: Int, lengthBefore: Int, lengthAfter: Int) {
        super.onTextChanged(text, start, lengthBefore, lengthAfter)
        // Ensure text is selectable after text changes
        setTextIsSelectable(true)
    }
}

