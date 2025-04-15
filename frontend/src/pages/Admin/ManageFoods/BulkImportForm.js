import React, { useState } from 'react';
import Button from '../../../components/Button/Button';
import { bulkImportFoods } from '../../../services/foodService';
import classes from './BulkImportForm.module.css';

export default function BulkImportForm({ shops, onImportComplete, onCancel }) {
  const [file, setFile] = useState(null);
  const [selectedShop, setSelectedShop] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    // Validate file type
    if (selectedFile) {
      const fileExt = selectedFile.name.split('.').pop().toLowerCase();
      if (['xlsx', 'xls', 'csv'].includes(fileExt)) {
        setFile(selectedFile);
        setError('');
      } else {
        setFile(null);
        setError('Only Excel (.xlsx, .xls) and CSV files are supported');
      }
    }
  };

  const handleShopChange = (e) => {
    setSelectedShop(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    
    if (!selectedShop) {
      setError('Please select a shop');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      const response = await bulkImportFoods(file, selectedShop);
      setResults(response);
      
      // If no errors or only some errors, consider it a success
      if (response.results.success > 0) {
        setTimeout(() => {
          onImportComplete();
        }, 3000); // Show results for 3 seconds before closing
      }
    } catch (err) {
      setError(err.response?.data || 'Failed to import food items');
      console.error('Import error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={classes.container}>
      <h2 className={classes.title}>Bulk Import Food Items</h2>
      
      {results ? (
        <div className={classes.results}>
          <h3>Import Results</h3>
          <p className={classes.summary}>
            Successfully imported {results.results.success} food items.
            {results.results.failed > 0 && (
              <span className={classes.error_text}> {results.results.failed} items failed.</span>
            )}
          </p>
          
          {results.results.errors.length > 0 && (
            <div className={classes.errors_list}>
              <h4>Errors:</h4>
              <ul>
                {results.results.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className={classes.buttons}>
            <Button 
              type="button" 
              text="Close" 
              onClick={onImportComplete} 
            />
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={classes.form}>
          <div className={classes.form_group}>
            <label htmlFor="shop">Select Shop*</label>
            <select
              id="shop"
              value={selectedShop}
              onChange={handleShopChange}
              required
              className={classes.select}
            >
              <option value="">-- Select a Shop --</option>
              {Array.isArray(shops) && shops.map(shop => (
                <option key={shop._id} value={shop._id}>
                  {shop.name}
                </option>
              ))}
            </select>
            <p className={classes.help_text}>Select the shop these food items will be added to</p>
          </div>
          
          <div className={classes.form_group}>
            <label htmlFor="spreadsheet">Upload File*</label>
            <input
              type="file"
              id="spreadsheet"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              required
              className={classes.file_input}
            />
            <p className={classes.help_text}>
              Upload a spreadsheet (.xlsx, .xls) or CSV file with food items.
              <br />The file should have at least 2 columns: "Food Name" and "Price"
            </p>
          </div>
          
          {error && <p className={classes.error}>{error}</p>}
          
          <div className={classes.template_section}>
            <h4>File Format</h4>
            <p>Your spreadsheet should have these columns:</p>
            <table className={classes.template_table}>
              <thead>
                <tr>
                  <th>Food Name</th>
                  <th>Price</th>
                  <th>Description (optional)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Pizza</td>
                  <td>10.99</td>
                  <td>Delicious cheese pizza</td>
                </tr>
                <tr>
                  <td>Burger</td>
                  <td>8.50</td>
                  <td>Classic beef burger</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className={classes.buttons}>
            <Button 
              type="submit" 
              text={isLoading ? "Importing..." : "Import Food Items"} 
              disabled={isLoading || !file || !selectedShop} 
            />
            <Button 
              type="button" 
              text="Cancel" 
              onClick={onCancel} 
              disabled={isLoading}
            />
          </div>
        </form>
      )}
    </div>
  );
}