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

## [2.6.0] - 2025-02-24
### Added
- search_targes parameter now supports intermediate field.
- add weights parameter in IndexOpt.

### Fixed
- fix incomplete type exports.

### Removed
- remove HybridBigramInvertedIndex.
- remove "weight:" parameter setting in query.


## [2.5.1] - 2025-02-21
### Added
- add type export SearchFn, SearchFnResult and SearchFnCallback

## [2.5.0] - 2025-02-20
### Added
- add callback functionarity in createSearchFn.

## [2.4.0] - 2025-02-20
### Added
- add utility function createSearchFn.

## [2.3.0] - 2025-02-18
### Added
- object validation is added in createIndexFromObject

### Removed
- createIndex option 'weight' and 'field_names' are removed.

## [2.2.1] - 2025-02-17
### Fixed
- fix fuzzy search bug in HybridTrieBigramInvertedIndex.

## [2.2.0] - 2025-02-16
### Added
- new search method HybridTrieBigramInvertedIndex.

### Deprecated
- HybridBigramInvertedIndex. use HybridTrieBigramInvertedIndex instead.

## [2.1.1] - 2025-02-07
### Fixed
- fix bug that query history is not initialized in GPULinearIndex.

### Changed
- the wordaround of search result is extended to 200 characters

## [2.1.0] - 2025-02-06
### Changed
- disable fuzzy search for queries of 2 characters or less

## [2.0.1] - 2025-02-04
### Fixed
- fix bug that query with a single character of '"' results in error.

## [2.0.0] - 2025-02-03
### Changed
- rename unisearch.js to staticseek

## [1.3.0] - 2025-02-01
### Changed
- SearchResult.key has now hierarchical structure.

## [1.2.4] - 2025-01-24
### Fixed
- fix bug that long query search more than 32 characters causes error.
- fix bug that GPU buffer may access concurrently.

### Changed
- update README.

## [1.2.3] - 2025-01-22
### Added
- export type UniSearchIndex and UniSearchIndexObject.

### Changed
- return type of createIndex and createIndexFromObject is now UniSearchIndex | UniSearchError.
- return type of indexToObject is now UniSearchIndexObject.
- update README due to the change of return type of createIndex, createIndexFromObject, and indexToObject.

### Fixed
- fix bug that index class is not found.
- some categories in CHANGELOG are fixed.

### Removed
- remove unused types.

## [1.2.2] - 2025-01-21
### Changed
- index version is updated to 1.2.2.

## [1.2.1] - 2025-01-21
### Changed
- allow undefined value in search_targets and key_fields.

## [1.2.0] - 2025-01-21
### Changed
- key_fields option now supports multiple fields.

## [1.1.1] - 2025-01-19
### Changed
- in LinearIndex, the wordaround of search result is extended to 100 characters.

## [1.1.0] - 2025-01-17
### Added
- GPU Linear Index scheme is added.

## [1.0.5] - 2025-01-14
### Changed
- in fuzzy search, distance is reduced to min(distance, keyword_length - 1).

### Fixed
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
### Changed
- update README.

## [1.0.2] - 2024-12-26
### Added
- export type SearchIndex.

## [1.0.0] - 2024-12-25
### Added
- generate search index, both Linear Index and Hybrid Bigram Inverted Index
- search both exact and fuzzy
- search frontend, google-like syntax
- sorting search result based on TF-IDF

[Unreleased]: https://github.com/osawa-naotaka/staticseek/compare/v2.6.0...HEAD
[2.6.0]: https://github.com/osawa-naotaka/staticseek/compare/v2.5.1...v2.6.0
[2.5.1]: https://github.com/osawa-naotaka/staticseek/compare/v2.5.0...v2.5.1
[2.5.0]: https://github.com/osawa-naotaka/staticseek/compare/v2.4.0...v2.5.0
[2.4.0]: https://github.com/osawa-naotaka/staticseek/compare/v2.3.0...v2.4.0
[2.3.0]: https://github.com/osawa-naotaka/staticseek/compare/v2.2.1...v2.3.0
[2.2.1]: https://github.com/osawa-naotaka/staticseek/compare/v2.2.0...v2.2.1
[2.2.0]: https://github.com/osawa-naotaka/staticseek/compare/v2.1.1...v2.2.0
[2.1.1]: https://github.com/osawa-naotaka/staticseek/compare/v2.1.0...v2.1.1
[2.1.0]: https://github.com/osawa-naotaka/staticseek/compare/v2.0.1...v2.1.0
[2.0.1]: https://github.com/osawa-naotaka/staticseek/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/osawa-naotaka/staticseek/compare/v1.3.0...v2.0.0
[1.3.0]: https://github.com/osawa-naotaka/staticseek/compare/v1.2.4...v1.3.0
[1.2.4]: https://github.com/osawa-naotaka/staticseek/compare/v1.2.3...v1.2.4
[1.2.3]: https://github.com/osawa-naotaka/staticseek/compare/v1.2.2...v1.2.3
[1.2.2]: https://github.com/osawa-naotaka/staticseek/compare/v1.2.1...v1.2.2
[1.2.1]: https://github.com/osawa-naotaka/staticseek/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/osawa-naotaka/staticseek/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/osawa-naotaka/staticseek/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/osawa-naotaka/staticseek/compare/v1.0.5...v1.1.0
[1.0.5]: https://github.com/osawa-naotaka/staticseek/compare/v1.0.4...v1.0.5
[1.0.4]: https://github.com/osawa-naotaka/staticseek/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/osawa-naotaka/staticseek/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/osawa-naotaka/staticseek/compare/v1.0.0...v1.0.2
