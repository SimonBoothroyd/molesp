cmake_minimum_required(VERSION 3.22)
project(molesp)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

option(BUILD_BINDING "Build the python binding" ON)
option(BUILD_TESTS "Build the tests" OFF)

set(SOURCE
        ${CMAKE_CURRENT_SOURCE_DIR}/bindings.cpp
        ${CMAKE_CURRENT_SOURCE_DIR}/march.cpp
        ${CMAKE_CURRENT_SOURCE_DIR}/march.h
        ${CMAKE_CURRENT_SOURCE_DIR}/smooth.cpp
        ${CMAKE_CURRENT_SOURCE_DIR}/smooth.h
        ${CMAKE_CURRENT_SOURCE_DIR}/lookup.h
        ${CMAKE_CURRENT_SOURCE_DIR}/utilities.h
)

if(BUILD_BINDING)
    find_package(pybind11 REQUIRED)
    include_directories(${pybind11_INCLUDE_DIRS})

    pybind11_add_module(_molesp ${SOURCE})
endif(BUILD_BINDING)

if(BUILD_TESTS)
    add_subdirectory(tests)
endif(BUILD_TESTS)