import React, { useState, useEffect, createContext } from 'react';
import api from '../api/regions';
import * as loglevel from 'loglevel';
import FilterRegion from 'models/FilterRegion';
import { getOrganizationUuid } from 'api/apiUtils';

const log = loglevel.getLogger('../context/RegionContext');

export const RegionContext = createContext({
  regions: [],
  pageSize: 24,
  count: null,
  currentPage: 0,
  filter: new FilterRegion(),
  isLoading: false,
  changePageSize: () => {},
  changeCurrentPage: () => {},
  updateRegions: () => {},
  load: () => {},
  getCount: () => {},
  getRegion: () => {},
  createRegion: () => {},
  updateRegion: () => {},
  updateFilter: () => {},
});

export function RegionProvider(props) {
  const [regions, setRegions] = useState([]);
  const [pageSize, setPageSize] = useState(25);
  const [count, setCount] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [filter, setFilter] = useState(new FilterRegion());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    load();
    getCount();
  }, [filter, pageSize, currentPage]); //

  // EVENT HANDLERS

  const changePageSize = async (pageSize) => {
    setPageSize(pageSize);
  };

  const changeCurrentPage = async (event, currentPage) => {
    setCurrentPage(currentPage);
  };

  const updateRegions = (regions) => {
    setRegions(regions);
  };

  const load = async () => {
    log.debug('load regions');
    setIsLoading(true);
    const pageNumber = currentPage;
    const regions = await api.getRegions({
      skip: pageNumber * pageSize,
      rowsPerPage: pageSize,
      filter: {
        owner_id: getOrganizationUuid() || undefined,
        ...filter,
      },
    });
    setRegions(regions);
    setIsLoading(false);
  };

  const getCount = async () => {
    const { count } = await api.getRegionsCount({
      owner_id: getOrganizationUuid() || undefined,
      ...filter,
    });
    setCount(count);
  };

  const getRegion = async (payload) => {
    const { id } = payload;
    // Look for a match in the local state first
    let region = regions.find((p) => p.id === id);
    if (!region) {
      // Otherwise query the API
      region = await api.getRegion(id);
    }
    return region;
  };

  const createRegion = async (payload) => {
    if (payload.shape.type.endsWith('Collection')) {
      const createdCollection = await api.createCollection(payload);
      setRegions((regions) => [...regions, ...createdCollection.regions]);
    } else {
      const createdRegion = await api.createRegion(payload);
      setRegions((regions) => [...regions, createdRegion]);
    }
  };

  const updateRegion = async (payload) => {
    delete payload.shape;
    delete payload.nameKey;
    const updatedRegion = await api.updateRegion(payload, payload.id);
    const index = regions.findIndex((p) => p.id === updatedRegion.id);
    if (index >= 0) {
      const regions = Object.assign([], regions, {
        [index]: updatedRegion,
      });
      setRegions(regions);
    }
  };

  const updateFilter = async (newFilter) => {
    setCurrentPage(0);
    setFilter(newFilter);
  };

  const value = {
    regions,
    pageSize,
    count,
    currentPage,
    filter,
    isLoading,
    changePageSize,
    changeCurrentPage,
    updateRegions,
    load,
    getCount,
    getRegion,
    createRegion,
    updateRegion,
    updateFilter,
  };

  return (
    <RegionContext.Provider value={value}>
      {props.children}
    </RegionContext.Provider>
  );
}
