//
// Created by Simon Boothroyd
//

#ifndef MOLESP_UTILITIES_H
#define MOLESP_UTILITIES_H

#include <functional>
#include <array>

namespace molesp {

    using Vector3 = std::array<float, 3>;

    struct hash_pair {

        template<class T1, class T2>
        std::size_t operator()(const std::pair<T1, T2> &p) const {
            auto hash1 = std::hash<T1>{}(p.first);
            auto hash2 = std::hash<T2>{}(p.second);
            return (hash1 != hash2) ? hash1 ^ hash2 : hash1;
        }
    };
}

#endif //MOLESP_UTILITIES_H
