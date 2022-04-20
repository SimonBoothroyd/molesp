//
// Created by Simon Boothroyd
//

#include <pybind11/pybind11.h>
#include <pybind11/numpy.h>

#include <string>

#include "march.h"

namespace py = pybind11;

namespace molesp {

    std::tuple<py::array, py::array>
    marchBinding(
            const py::array_t<float, py::array::f_style | py::array::forcecast> &data,
            float isoLevel,
            int nSmoothingIterations,
            float smoothingFactor
    ) {
        auto buffer = data.request();

        if (buffer.ndim != 3) {
            throw py::value_error(
                    "ndim must be 3, not " + std::to_string(buffer.ndim));
        }

        auto x_shape = (int) buffer.shape[0];
        auto y_shape = (int) buffer.shape[1];
        auto z_shape = (int) buffer.shape[2];

        auto *volume_ptr = (float *) buffer.ptr;

        auto mesh = march(volume_ptr, x_shape, y_shape, z_shape, isoLevel,
                          nSmoothingIterations, smoothingFactor);

        const auto nVertices = int(mesh.vertices.size());
        const auto nIndices = int(mesh.indices.size());

        auto vertex_info = py::buffer_info(
                (float *) mesh.vertices.data(),
                sizeof(float),
                py::format_descriptor<float>::format(),
                2,
                {nVertices, 3},
                {sizeof(float) * 3, sizeof(float)}
        );
        auto vertex_array = py::array(vertex_info);

        auto index_info = py::buffer_info(
                (int *) mesh.indices.data(),
                sizeof(int),
                py::format_descriptor<int>::format(),
                2,
                {nIndices, 1},
                {sizeof(int) * 1, sizeof(int)}
        );
        auto index_array = py::array(index_info);

        return std::make_tuple(vertex_array, index_array);
    }

}

PYBIND11_MODULE(_molesp, m) {
    m.def("march", &molesp::marchBinding, "Marching cubes implementation");
}
