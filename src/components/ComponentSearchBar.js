import React, { useState, useEffect, useRef } from 'react';
import { Form, InputGroup, Dropdown, Spinner, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faCheck } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';

const ComponentSearchBar = ({ 
  onSearch, 
  showDropdown = true,
  placeholder = "Search for components...",
  initialValue = "",
  searchType: initialSearchType,
  field: initialField
}) => {
  const navigate = useNavigate();

  // Load saved preferences from localStorage, fallback to props or defaults
  const getSavedSearchType = () => {
    if (initialSearchType) return initialSearchType;
    return localStorage.getItem('defaultSearchType') || 'begins_with';
  };

  const getSavedField = () => {
    if (initialField) return initialField;
    return localStorage.getItem('defaultField') || 'mpn';
  };

  const [searchValue, setSearchValue] = useState(initialValue);
  const [searchType, setSearchType] = useState(getSavedSearchType());
  const [field, setField] = useState(getSavedField());
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [dropdownResults, setDropdownResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const searchTimeoutRef = useRef(null);
  const dropdownRef = useRef(null);

  // Handle clicks outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search for dropdown results
  useEffect(() => {
    if (!showDropdown) return;

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Don't search if less than 3 characters or not focused
    if (searchValue.length < 3 || !isFocused) {
      setDropdownResults([]);
      setShowResults(false);
      return;
    }

    // Set new timeout for search
    searchTimeoutRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await apiService.search(field, searchValue, searchType, 'search_bar');
        const data = response.data;

        if (data.items) {
          setDropdownResults(data.items);
          setShowResults(true);
        }
      } catch (error) {
        console.error('Search error:', error);
        setDropdownResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300); // 300ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchValue, searchType, field, showDropdown, isFocused]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchValue.length >= 3) {
      setShowResults(false);
      if (onSearch) {
        onSearch(searchValue, searchType, field);
      } else {
        // Navigate to search results page with query parameters
        const params = new URLSearchParams({
          search_type: searchType,
          field: field,
          field_value: searchValue
        });
        navigate(`/search?${params.toString()}`);
      }
    }
  };

  const handleResultClick = (item) => {
    setSearchValue(item.part_number || item.mfr || '');
    setShowResults(false);
    // Navigate to search results with the selected item
    const params = new URLSearchParams({
      search_type: 'exact',
      field: 'mpn',
      field_value: item.part_number || ''
    });
    navigate(`/search?${params.toString()}`);
  };

  const handleSaveDefaults = () => {
    localStorage.setItem('defaultSearchType', searchType);
    localStorage.setItem('defaultField', field);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="position-relative" ref={dropdownRef}>
      <Form onSubmit={handleSearch}>
        <InputGroup className="mb-3">
          <Form.Select 
            value={searchType} 
            onChange={(e) => setSearchType(e.target.value)}
            style={{ maxWidth: '150px' }}
          >
            <option value="exact">Exact Match</option>
            <option value="begins_with">Begins With</option>
          </Form.Select>

          <Form.Select 
            value={field} 
            onChange={(e) => setField(e.target.value)}
            style={{ maxWidth: '150px' }}
          >
            <option value="mpn">Part Number</option>
            <option value="manufacturer">Manufacturer</option>
          </Form.Select>

          <Form.Control
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={placeholder}
            onFocus={() => {
              setIsFocused(true);
              if (searchValue.length >= 3) {
                setShowResults(true);
              }
            }}
            onBlur={() => {
              // Delay to allow click events on dropdown items
              setTimeout(() => setIsFocused(false), 200);
            }}
          />

          <button 
            className="btn btn-primary" 
            type="submit"
            disabled={searchValue.length < 3}
          >
            Search
          </button>

          <Button 
            variant="outline-secondary"
            onClick={handleSaveDefaults}
            title="Save current search type and field as default"
            style={{ whiteSpace: 'nowrap' }}
          >
            <FontAwesomeIcon icon={saveSuccess ? faCheck : faSave} />
            {saveSuccess ? ' Saved!' : ' Save Defaults'}
          </Button>
        </InputGroup>

        {searchValue.length > 0 && searchValue.length < 3 && (
          <small className="text-muted">Please enter at least 3 characters to search</small>
        )}
      </Form>

      {/* Dropdown results */}
      {showDropdown && showResults && (dropdownResults.length > 0 || isLoading) && (
        <div 
          className="position-absolute w-100 bg-white border rounded-bottom shadow-sm" 
          style={{ 
            top: '100%', 
            zIndex: 1050,
            maxHeight: '400px',
            overflowY: 'auto'
          }}
        >
          {isLoading ? (
            <div className="p-3 text-center">
              <Spinner animation="border" size="sm" /> Loading...
            </div>
          ) : (
            <div className="list-group list-group-flush">
              {dropdownResults.map((item, index) => (
                <button
                  key={index}
                  className="list-group-item list-group-item-action"
                  onClick={() => handleResultClick(item)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <div className="fw-bold">{item.part_number}</div>
                      <small className="text-muted">
                        {item.numResults} results
                      </small>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ComponentSearchBar;
