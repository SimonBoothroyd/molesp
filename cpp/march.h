//
// Created by Simon Boothroyd
//

#ifndef MOLESP_MARCH_H
#define MOLESP_MARCH_H

#include <unordered_map>
#include <unordered_set>
#include <vector>
#include <array>
#include "utilities.h"

namespace molesp {

    using EdgeVertexIndices = std::pair<int, int>;
    using EdgeVertexMap = std::unordered_map<EdgeVertexIndices, int, molesp::hash_pair>;

    struct Triangle {
        EdgeVertexIndices cornerA;
        EdgeVertexIndices cornerB;
        EdgeVertexIndices cornerC;
    };

    struct Mesh {
        const std::vector<Vector3> vertices;
        const std::vector<int> indices;
    };

    static inline int convert3DIndexTo1D(
            int x,
            int y,
            int z,
            int dataWidth,
            int dataHeight
    );

    static EdgeVertexIndices cubeEdgeToEdgeVertexIndices(
            int edgeIndex,
            int cubeX,
            int cubeY,
            int cubeZ,
            int dataWidth,
            int dataHeight
    );

    static Vector3 edgeVertexIndicesToCoordinates(
            EdgeVertexIndices index,
            int dataWidth,
            int dataHeight
    );

    static std::vector<Triangle> marchSingle(
            int x,
            int y,
            int z,
            const float *data,
            int dataWidth,
            int dataHeight,
            int dataDepth,
            float isoLevel
    );

    Mesh march(
            const float *data,
            int dataWidth,
            int dataHeight,
            int dataDepth,
            float isoLevel,
            int nSmoothingIterations,
            float smoothingFactor
    );

} // molesp

#endif //MOLESP_MARCH_H
