//
// Created by Simon Boothroyd
//

#ifndef MOLESP_SMOOTH_H
#define MOLESP_SMOOTH_H

#include "utilities.h"
#include <unordered_set>
#include <vector>


namespace molesp {

    using AdjacencyMap = std::vector<std::unordered_set<int>>;

    static AdjacencyMap buildAdjacencyMap(
            const std::vector<Vector3> &vertices,
            const std::vector<int> &indices
    );

    static std::vector<Vector3> applySmoothingIteration(
            const std::vector<Vector3> &vertices,
            const AdjacencyMap &adjacencyMap,
            float smoothingFactor
    );

    std::vector<Vector3> applySmoothing(
            const std::vector<Vector3> &vertices,
            const std::vector<int> &indices,
            int nIterations,
            float smoothingFactor
    );

}

#endif //MOLESP_SMOOTH_H
