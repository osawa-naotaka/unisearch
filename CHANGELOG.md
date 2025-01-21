# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

- Added: for new features.
- Changed: for changes in existing functionality.
- Deprecated: for soon-to-be removed features.
- Removed: for now removed features.
- Fixed: for any bug fixes.
- Security: in case of vulnerabilities.

## [Unreleased]

## [1.2.2] - 2025-01-21
### Fixed
- index version is updated to 1.2.2.

## [1.2.1] - 2025-01-21
### Fixed
- allow undefined value in search_targets and key_fields.

## [1.2.0] - 2025-01-21
### Added
- key_fields option now supports multiple fields.

## [1.1.1] - 2025-01-19
### Fixed
- in LinearIndex, the wordaround of search result is extended to 100 characters.

## [1.1.0] - 2025-01-17
### Added
- GPU Linear Index scheme is added.

## [1.0.5] - 2025-01-14
### Fixed
- in fuzzy search, distance is reduced to min(distance, keyword_length - 1).
- in HybridBigramInvertedIndex, fix bug that alphabet-and-kanji-combined keyword is not searched correctly.

## [1.0.4] - 2025-01-07
### Fixed
- fuzzy search bug is fixed.
  - The bitap algorithm did not correctly calculate the single-character deletion status.
  - Once a match was made, the search state was cleared entirely, resulting in fewer matches.
  - In HybridBigramInvertedIndex, the edit distance was not calculated correctly. 
- Typo in README is fixed.
- Typo of search class is fixed. Not HyblidBigramInvertedIndex, but HybridBigramInvertedIndex.

## [1.0.3] - 2024-12-28
### Fixed
- update README.

## [1.0.2] - 2024-12-26
### Fixed
- export type SearchIndex.

## [1.0.0] - 2024-12-25
### Added
- generate search index, both Linear Index and Hybrid Bigram Inverted Index
- search both exact and fuzzy
- search frontend, google-like syntax
- sorting search result based on TF-IDF

[Unreleased]: https://github.com/osawa-naotaka/unisearch/compare/v1.2.2...HEAD
[1.2.2]: https://github.com/osawa-naotaka/unisearch/compare/v1.2.1...v1.2.2
[1.2.1]: https://github.com/osawa-naotaka/unisearch/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/osawa-naotaka/unisearch/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/osawa-naotaka/unisearch/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/osawa-naotaka/unisearch/compare/v1.0.5...v1.1.0
[1.0.5]: https://github.com/osawa-naotaka/unisearch/compare/v1.0.4...v1.0.5
[1.0.4]: https://github.com/osawa-naotaka/unisearch/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/osawa-naotaka/unisearch/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/osawa-naotaka/unisearch/compare/v1.0.0...v1.0.2
