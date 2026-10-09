"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Filter, Clock, ArrowRight } from "lucide-react";
import { search, getRecentSearches, saveRecentSearch, clearRecentSearches, getSearchSuggestions, SearchResult, SearchResultType } from "@/app/utils/searchService";
import Image from "next/image";

interface SearchDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (url: string) => void;
}

const SearchDropdown: React.FC<SearchDropdownProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<{
    resultType?: SearchResultType;
    state?: string;
    programType?: string;
  }>({});

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<any>(null);

  // Get data for filters
  const recentSearches = getRecentSearches();
  const suggestions = getSearchSuggestions();

  // Perform search with debouncing
  const performSearch = useCallback((searchQuery: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      const searchResults = search(searchQuery, filters);
      setResults(searchResults);
      setSelectedIndex(-1);
    }, 300);
  }, [filters]);

  // Handle input changes
  useEffect(() => {
    if (query.trim()) {
      performSearch(query);
    } else {
      setResults([]);
      setSelectedIndex(-1);
    }
  }, [query, performSearch]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(prev => prev > -1 ? prev - 1 : -1);
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleResultClick(results[selectedIndex]);
        } else if (query.trim()) {
          // Search for current query
          const searchResults = search(query, filters);
          if (searchResults.length > 0) {
            handleResultClick(searchResults[0]);
          }
        }
        break;
      case "Escape":
        e.preventDefault();
        onClose();
        break;
    }
  };

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    saveRecentSearch(query);
    onClose();
    setQuery("");

    if (onNavigate) {
      onNavigate(result.url);
    } else {
      window.location.href = result.url;
    }
  };

  // Handle suggestion/recent search click
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    performSearch(suggestion);
  };

  // Clear recent searches
  const handleClearRecent = () => {
    clearRecentSearches();
  };

  // Update filter
  const updateFilter = (key: keyof typeof filters, value: string | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  // Group results by type
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<SearchResultType, SearchResult[]>);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      const target = event.target as HTMLElement;

      // Don't close if clicking on form elements or interactive elements
      if (target.tagName === 'INPUT' ||
          target.tagName === 'BUTTON' ||
          target.tagName === 'SELECT' ||
          target.tagName === 'OPTION' ||
          target.closest('button') ||
          target.closest('input') ||
          target.closest('select')) {
        return;
      }

      // Check if the clicked element is not inside the dropdown
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => {
        document.removeEventListener("click", handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="fixed top-20 left-1/2 transform -translate-x-1/2 max-w-7xl bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-96 overflow-hidden"
    >
      {/* Search Input */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative flex items-center">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            placeholder="Search products, states, or pages..."
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-black"
          />
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filters Toggle */}
        {/* <div className="flex items-center justify-between mt-2">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowFilters(!showFilters);
            }}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
          {Object.keys(filters).some(key => filters[key as keyof typeof filters]) && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setFilters({});
              }}
              className="text-sm text-green-600 hover:text-green-800"
            >
              Clear filters
            </button>
          )}
        </div> */}

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-3 p-3 bg-gray-50 rounded-md space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Result Type
              </label>
              <select
                value={filters.resultType || ""}
                onChange={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  updateFilter("resultType", e.target.value || undefined);
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-full text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="">All Types</option>
                <option value="product">Products</option>
                <option value="state">States</option>
                <option value="page">Pages</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <select
                value={filters.state || ""}
                onChange={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  updateFilter("state", e.target.value || undefined);
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-full text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="">All States</option>
                <option value="California">California</option>
                <option value="Texas">Texas</option>
                <option value="Florida">Florida</option>
                <option value="New York">New York</option>
                {/* Add more states as needed */}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Search Results */}
      <div className="max-h-80 overflow-y-auto">
        {query.trim() ? (
          results.length > 0 ? (
            <div className="p-2">
              {Object.entries(groupedResults).map(([type, typeResults]) => (
                <div key={type} className="mb-4">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {type === "product" ? "Products" : type === "state" ? "States" : "Pages"} ({typeResults.length})
                  </div>
                  {typeResults.slice(0, 5).map((result, index) => {
                    const globalIndex = results.findIndex(r => r.id === result.id);
                    const isSelected = globalIndex === selectedIndex;

                    return (
                      <button
                        key={result.id}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleResultClick(result);
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-gray-50 focus:outline-none focus:bg-gray-50 ${
                          isSelected ? "bg-green-50" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {result.metadata?.flag && (
                            <div className="w-5 h-4 flex-shrink-0 mt-0.5">
                              <Image
                                src={result.metadata.flag}
                                alt=""
                                width={20}
                                height={15}
                                className="w-full h-full object-cover rounded"
                                onError={(e) => {
                                  // Hide broken images
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">
                              {result.title}
                            </div>
                            {result.subtitle && (
                              <div className="text-sm text-gray-600 truncate">
                                {result.subtitle}
                              </div>
                            )}
                            {result.description && (
                              <div className="text-sm text-gray-500 truncate">
                                {result.description}
                              </div>
                            )}
                            {result.metadata?.price && (
                              <div className="text-sm font-semibold text-green-600">
                                ${result.metadata.price}
                              </div>
                            )}
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-400 mt-1" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              No results found for "{query}"
            </div>
          )
        ) : (
          /* Suggestions when no query */
          <div className="p-2">
            {recentSearches.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between px-3 py-2">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Recent Searches
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleClearRecent();
                    }}
                    className="text-xs text-gray-600 hover:text-gray-800"
                  >
                    Clear
                  </button>
                </div>
                {recentSearches.slice(0, 3).map((recent, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSuggestionClick(recent);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 focus:outline-none focus:bg-gray-50 flex items-center gap-2"
                  >
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">{recent}</span>
                  </button>
                ))}
              </div>
            )}

            <div>
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Popular Searches
              </div>
              {suggestions.slice(0, 5).map((suggestion, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSuggestionClick(suggestion);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 focus:outline-none focus:bg-gray-50 text-gray-700"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchDropdown;