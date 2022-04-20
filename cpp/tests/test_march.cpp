//
// Created by Simon Boothroyd
//

#include <gtest/gtest.h>

#include "../march.h"

TEST(MarchTest, SimpleTest) {

    const float density[27] = {
            0.0, 0.0, 0.0,
            0.0, 0.0, 0.0,
            0.0, 0.0, 0.0,
            //
            0.0, 0.0, 0.0,
            0.0, 1.0, 0.0,
            0.0, 0.0, 0.0,
            //
            0.0, 0.0, 0.0,
            0.0, 0.0, 0.0,
            0.0, 0.0, 0.0,
    };

    const auto mesh = molesp::march(density, 3, 3, 3, 0.5, 1, 0.05);

    ASSERT_EQ(mesh.vertices.size(), 6);
    ASSERT_EQ(mesh.indices.size(), 8 * 3);
}