// filepath: /root/foodsite/frontend/src/components/Header/ExtendedHeader.js
import React from 'react';
import { Link } from 'react-router-dom';
import Header from './Header';
import Search from '../Search/Search';
import classes from './extendedHeader.module.css';

export default function ExtendedHeader({ tags }) {
  // Get the current tag from URL path if any
  const currentPath = window.location.pathname;
  const currentTag = currentPath.startsWith('/tag/') ? 
    decodeURIComponent(currentPath.substring('/tag/'.length)) : 
    '';

  return (
    <div className={classes.extendedHeaderWrapper}>
      <Header />
      <div className={classes.extendedContent}>
        <div className={classes.contentLayout}>
          <div className={classes.titleSection}>
            <h1>Uni</h1>
            <h1>Rush</h1>
          </div>
          <div className={classes.rightContent}>
            <div className={classes.searchSection}>
              <Search 
                placeholder="Search for restaurants..."
                margin="0"
              />
            </div>
            <div className={classes.tagsContainer}>
              {tags && tags.length > 0 && (
                <div className={classes.tagButtons}>
                  {tags.map(tag => (
                    <Link 
                      key={tag.name} 
                      to={`/tag/${tag.name}`} 
                      className={`${classes.tagButton} ${currentTag === tag.name ? classes.active : ''}`}
                    >
                      {tag.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
