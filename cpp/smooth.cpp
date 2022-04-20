//
// Created by Simon Boothroyd
//

#include "smooth.h"

namespace molesp {

    static AdjacencyMap buildAdjacencyMap(
            const std::vector<Vector3> &vertices,
            const std::vector<int> &indices
    ) {
        AdjacencyMap adjacencyMap(vertices.size());

        for (int i = 0; i < indices.size(); i += 3) {
            adjacencyMap[indices[i]].insert(indices[i + 1]);
            adjacencyMap[indices[i]].insert(indices[i + 2]);
            adjacencyMap[indices[i + 1]].insert(indices[i + 0]);
            adjacencyMap[indices[i + 1]].insert(indices[i + 2]);
            adjacencyMap[indices[i + 2]].insert(indices[i + 0]);
            adjacencyMap[indices[i + 2]].insert(indices[i + 1]);
        }

        return adjacencyMap;
    }

    static std::vector<Vector3> applySmoothingIteration(
            const std::vector<Vector3> &vertices,
            const AdjacencyMap &adjacencyMap,
            const float smoothingFactor
    ) {

        std::vector<Vector3> smoothedVertices(vertices.size());

        for (int i = 0; i < adjacencyMap.size(); i++) {

            for (const auto &neighbourIndex: adjacencyMap[i]) {
                smoothedVertices[i][0] += vertices[neighbourIndex][0];
                smoothedVertices[i][1] += vertices[neighbourIndex][1];
                smoothedVertices[i][2] += vertices[neighbourIndex][2];
            }

            const auto nNeighbours = float(adjacencyMap[i].size());

            smoothedVertices[i][0] *= smoothingFactor / nNeighbours;
            smoothedVertices[i][1] *= smoothingFactor / nNeighbours;
            smoothedVertices[i][2] *= smoothingFactor / nNeighbours;

            smoothedVertices[i][0] += (1.0f - smoothingFactor) * vertices[i][0];
            smoothedVertices[i][1] += (1.0f - smoothingFactor) * vertices[i][1];
            smoothedVertices[i][2] += (1.0f - smoothingFactor) * vertices[i][2];
        }

        return smoothedVertices;
    }

    std::vector<Vector3> applySmoothing(
            const std::vector<Vector3> &vertices,
            const std::vector<int> &indices,
            const int nIterations,
            const float smoothingFactor
    ) {
        const auto adjacencyMap = buildAdjacencyMap(vertices, indices);

        auto smoothedVertices = vertices;

        for (int i = 0; i < nIterations; i++) {
            smoothedVertices = applySmoothingIteration(smoothedVertices, adjacencyMap,
                                                       smoothingFactor);
        }

        return smoothedVertices;
    }

}
