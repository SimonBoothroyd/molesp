//
// Created by Simon Boothroyd
//

#include "march.h"
#include "lookup.h"
#include "smooth.h"
#include <array>
#include <vector>

namespace molesp {

    static inline int convert3DIndexTo1D(
            const int x,
            const int y,
            const int z,
            const int dataWidth,
            const int dataHeight
    ) {
        return z * dataWidth * dataHeight + y * dataWidth + x;
    }

    static EdgeVertexIndices cubeEdgeToEdgeVertexIndices(
            const int edgeIndex,
            const int cubeX,
            const int cubeY,
            const int cubeZ,
            const int dataWidth,
            const int dataHeight
    ) {

        const auto [cubeIndexA, cubeIndexB] = molesp::edgeConnection[edgeIndex];

        const auto [xA, yA, zA] = molesp::vertexCoord[cubeIndexA];
        const auto [xB, yB, zB] = molesp::vertexCoord[cubeIndexB];

        const auto indexA = convert3DIndexTo1D(
                cubeX + xA, cubeY + yA, cubeZ + zA, dataWidth, dataHeight
        );
        const auto indexB = convert3DIndexTo1D(
                cubeX + xB, cubeY + yB, cubeZ + zB, dataWidth, dataHeight
        );

        return (indexA < indexB) ? std::make_pair(indexA, indexB) : std::make_pair(
                indexB,
                indexA);
    }

    static Vector3 edgeVertexIndicesToCoordinates(
            const EdgeVertexIndices index,
            const int dataWidth,
            const int dataHeight
    ) {
        const auto [indexA, indexB] = index;

        const auto xA = indexA % dataWidth;
        const auto yA = (indexA / dataWidth) % dataHeight;
        const auto zA = indexA / (dataWidth * dataHeight);

        const auto xB = indexB % dataWidth;
        const auto yB = (indexB / dataWidth) % dataHeight;
        const auto zB = indexB / (dataWidth * dataHeight);

        return {0.5f * float(xA + xB), 0.5f * float(yA + yB), 0.5f * float(zA + zB)};
    }

    static std::vector<Triangle> marchSingle(
            const int x,
            const int y,
            const int z,
            const float *data,
            const int dataWidth,
            const int dataHeight,
            const int dataDepth,
            const float isoLevel
    ) {

        if (x >= dataWidth - 1 || y >= dataHeight - 1 || z >= dataDepth - 1) return {};

        float cornerValues[8] = {
                data[convert3DIndexTo1D(x, y, z, dataWidth, dataHeight)],
                data[convert3DIndexTo1D(x + 1, y, z, dataWidth, dataHeight)],
                data[convert3DIndexTo1D(x + 1, y + 1, z, dataWidth, dataHeight)],
                data[convert3DIndexTo1D(x, y + 1, z, dataWidth, dataHeight)],
                data[convert3DIndexTo1D(x, y, z + 1, dataWidth, dataHeight)],
                data[convert3DIndexTo1D(x + 1, y, z + 1, dataWidth, dataHeight)],
                data[convert3DIndexTo1D(x + 1, y + 1, z + 1, dataWidth, dataHeight)],
                data[convert3DIndexTo1D(x, y + 1, z + 1, dataWidth, dataHeight)]
        };

        int cubeIndex = 0;

        if (cornerValues[0] < isoLevel) cubeIndex |= 1;
        if (cornerValues[1] < isoLevel) cubeIndex |= 2;
        if (cornerValues[2] < isoLevel) cubeIndex |= 4;
        if (cornerValues[3] < isoLevel) cubeIndex |= 8;
        if (cornerValues[4] < isoLevel) cubeIndex |= 16;
        if (cornerValues[5] < isoLevel) cubeIndex |= 32;
        if (cornerValues[6] < isoLevel) cubeIndex |= 64;
        if (cornerValues[7] < isoLevel) cubeIndex |= 128;

        std::vector<Triangle> triangles;

        for (int i = 0; molesp::triangleConnectionTable[cubeIndex][i] != -1; i += 3) {

            const auto edgeIndexA = molesp::triangleConnectionTable[cubeIndex][i];
            const auto edgeIndexB = molesp::triangleConnectionTable[cubeIndex][i + 1];
            const auto edgeIndexC = molesp::triangleConnectionTable[cubeIndex][i + 2];

            const auto indexA = cubeEdgeToEdgeVertexIndices(edgeIndexA, x, y, z,
                                                            dataWidth,
                                                            dataHeight);
            const auto indexB = cubeEdgeToEdgeVertexIndices(edgeIndexB, x, y, z,
                                                            dataWidth,
                                                            dataHeight);
            const auto indexC = cubeEdgeToEdgeVertexIndices(edgeIndexC, x, y, z,
                                                            dataWidth,
                                                            dataHeight);

            triangles.push_back({indexA, indexB, indexC});
        }

        return triangles;
    }

    Mesh march(
            const float *data,
            const int dataWidth,
            const int dataHeight,
            const int dataDepth,
            const float isoLevel,
            const int nSmoothingIterations,
            float smoothingFactor
    ) {

        std::vector<Triangle> triangles;

        for (int z = 0; z < dataDepth - 1; z++) {
            for (int y = 0; y < dataHeight - 1; y++) {
                for (int x = 0; x < dataWidth - 1; x++) {

                    const auto cubeTriangles = marchSingle(
                            x, y, z, data, dataWidth, dataHeight, dataDepth, isoLevel
                    );

                    triangles.insert(triangles.end(), cubeTriangles.begin(),
                                     cubeTriangles.end());
                }
            }
        }

        std::vector<Vector3> vertices;
        std::vector<int> indices;

        EdgeVertexMap vertexMap;

        for (const auto &triangle: triangles) {

            if (vertexMap.find(triangle.cornerA) == vertexMap.end()) {
                vertexMap[triangle.cornerA] = (int) vertices.size();
                vertices.push_back(
                        edgeVertexIndicesToCoordinates(triangle.cornerA, dataWidth,
                                                       dataHeight));
            }
            if (vertexMap.find(triangle.cornerB) == vertexMap.end()) {
                vertexMap[triangle.cornerB] = (int) vertices.size();
                vertices.push_back(
                        edgeVertexIndicesToCoordinates(triangle.cornerB, dataWidth,
                                                       dataHeight));
            }
            if (vertexMap.find(triangle.cornerC) == vertexMap.end()) {
                vertexMap[triangle.cornerC] = (int) vertices.size();
                vertices.push_back(
                        edgeVertexIndicesToCoordinates(triangle.cornerC, dataWidth,
                                                       dataHeight));
            }

            indices.push_back(vertexMap[triangle.cornerA]);
            indices.push_back(vertexMap[triangle.cornerB]);
            indices.push_back(vertexMap[triangle.cornerC]);
        }

        if (nSmoothingIterations > 0) {
            vertices = applySmoothing(vertices, indices, nSmoothingIterations,
                                      smoothingFactor);
        }

        return {vertices, indices};
    }

} // molesp