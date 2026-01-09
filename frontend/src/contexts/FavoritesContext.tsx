import React, { createContext, useContext, useState, ReactNode } from "react";

export type FavoriteEntityType = "deal" | "lead" | "account";

export interface FavoriteEntity {
  id: string;
  type: FavoriteEntityType;
  name: string;
  color?: string;
}

interface FavoritesContextType {
  favoriteEntities: FavoriteEntity[];
  toggleFavorite: (entity: FavoriteEntity) => void;
  isFavorite: (entityId: string, entityType: FavoriteEntityType) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(
  undefined
);

export const FavoritesProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [favoriteEntities, setFavoriteEntities] = useState<FavoriteEntity[]>(
    []
  );

  const toggleFavorite = (entity: FavoriteEntity) => {
    setFavoriteEntities((prev) => {
      const existingIndex = prev.findIndex(
        (fav) => fav.id === entity.id && fav.type === entity.type
      );

      if (existingIndex > -1) {
        // Remove from favorites
        return prev.filter((_, index) => index !== existingIndex);
      } else {
        // Add to favorites
        return [...prev, entity];
      }
    });
  };

  const isFavorite = (entityId: string, entityType: FavoriteEntityType) => {
    return favoriteEntities.some(
      (fav) => fav.id === entityId && fav.type === entityType
    );
  };

  return (
    <FavoritesContext.Provider
      value={{ favoriteEntities, toggleFavorite, isFavorite }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
};
