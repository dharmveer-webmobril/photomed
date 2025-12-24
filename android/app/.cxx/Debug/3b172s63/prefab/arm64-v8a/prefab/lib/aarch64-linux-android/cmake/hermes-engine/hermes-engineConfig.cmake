if(NOT TARGET hermes-engine::hermesvm)
add_library(hermes-engine::hermesvm SHARED IMPORTED)
set_target_properties(hermes-engine::hermesvm PROPERTIES
    IMPORTED_LOCATION "/Users/ravi/.gradle/caches/9.0.0/transforms/adeaa46c7951e585fdea25628bb27c2f/transformed/hermes-android-0.82.1-debug/prefab/modules/hermesvm/libs/android.arm64-v8a/libhermesvm.so"
    INTERFACE_INCLUDE_DIRECTORIES "/Users/ravi/.gradle/caches/9.0.0/transforms/adeaa46c7951e585fdea25628bb27c2f/transformed/hermes-android-0.82.1-debug/prefab/modules/hermesvm/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

