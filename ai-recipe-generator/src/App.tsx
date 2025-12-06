import { useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import './App.css';

const client = generateClient<Schema>();

interface Recipe {
  body?: string;
  error?: string;
}

function App() {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [currentIngredient, setCurrentIngredient] = useState('');
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addIngredient = () => {
    if (currentIngredient.trim() && !ingredients.includes(currentIngredient.trim())) {
      setIngredients([...ingredients, currentIngredient.trim()]);
      setCurrentIngredient('');
    }
  };

  const removeIngredient = (ingredient: string) => {
    setIngredients(ingredients.filter(i => i !== ingredient));
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addIngredient();
    }
  };

  const generateRecipe = async () => {
    if (ingredients.length === 0) {
      setError('Please add at least one ingredient');
      return;
    }

    setLoading(true);
    setError(null);
    setRecipe(null);

    try {
      const { data, errors } = await client.queries.askBedrock({
        ingredients: ingredients,
      });

      if (errors) {
        setError(errors.map(e => e.message).join(', '));
      } else if (data) {
        setRecipe(data as Recipe);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate recipe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <div className="app-container">
        <header className="app-header">
          <h1>🍳 AI Recipe Generator</h1>
          <p>Enter your ingredients and let AI create amazing recipes for you!</p>
        </header>

        <div className="recipe-form">
          <div className="input-group">
            <label htmlFor="ingredient">Add Ingredients</label>
            <div className="ingredients-input">
              <input
                id="ingredient"
                type="text"
                value={currentIngredient}
                onChange={(e) => setCurrentIngredient(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="e.g., chicken, tomatoes, garlic"
              />
              <button onClick={addIngredient} type="button">
                Add
              </button>
            </div>
          </div>

          {ingredients.length > 0 && (
            <div className="ingredients-list">
              {ingredients.map((ingredient) => (
                <div key={ingredient} className="ingredient-tag">
                  {ingredient}
                  <button onClick={() => removeIngredient(ingredient)} type="button">
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            className="generate-button"
            onClick={generateRecipe}
            disabled={loading || ingredients.length === 0}
          >
            {loading ? 'Generating Recipe...' : 'Generate Recipe'}
          </button>

          {error && <div className="error">{error}</div>}
        </div>

        {loading && (
          <div className="recipe-result loading">
            <div className="loading-spinner"></div>
            <p>Creating your recipe...</p>
          </div>
        )}

        {recipe && !loading && (
          <div className="recipe-result">
            <h2>Your Recipe</h2>
            {recipe.error ? (
              <div className="error">{recipe.error}</div>
            ) : (
              <div className="recipe-content">{recipe.body}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
