import React, { createContext, useContext, useState, ReactNode } from "react";

export interface Resource {
    id: number;
    title: string;
    description: string;
    type: string;
    photos: {
        id: number;
        resource_id: number;
        photo_url: string;
        photo_filename: string;
        is_primary: boolean;
        alt_text?: string;
        file_size: number;
        mime_type: string;
        width?: number;
        height?: number;
        display_order: number;
        created_at: string;
    }[];
    owner_id: number;
    owner_name: string;
    owner_latitude?: number;
    owner_longitude?: number;
    owner_address?: string;
    average_rating?: number;
    review_count?: number;
    condition?: string;
    category?: string;
    price?: number;
    estimated_value?: number;
    availability?: string;
    is_available?: boolean;
    status?: string;
    owner?: {
        id: number;
        name: string;
        email: string;
    };
}

interface ResourceContextType {
    resources: Resource[];
    setResources: React.Dispatch<React.SetStateAction<Resource[]>>;
    addResource: (resource: Resource) => void;
    updateResource: (id: number, resource: Partial<Resource>) => void;
    removeResource: (id: number) => void;
    refreshResources: () => void;
    isLoading: boolean;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

const ResourceContext = createContext<ResourceContextType | undefined>(
    undefined
);

export const useResource = (): ResourceContextType => {
    const context = useContext(ResourceContext);
    if (!context) {
        throw new Error("useResource must be used within a ResourceProvider");
    }
    return context;
};

interface ResourceProviderProps {
    children: ReactNode;
}

export const ResourceProvider: React.FC<ResourceProviderProps> = ({
    children,
}) => {
    const [resources, setResources] = useState<Resource[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const addResource = (resource: Resource) => {
        setResources((prev) => [resource, ...prev]);
    };

    const updateResource = (id: number, updatedResource: Partial<Resource>) => {
        setResources((prev) =>
            prev.map((resource) =>
                resource.id === id
                    ? { ...resource, ...updatedResource }
                    : resource
            )
        );
    };

    const removeResource = (id: number) => {
        setResources((prev) => prev.filter((resource) => resource.id !== id));
    };

    const refreshResources = () => {
        // This will be called by components that need to refresh
        // The actual fetch logic will be in the consuming components
    };

    const value: ResourceContextType = {
        resources,
        setResources,
        addResource,
        updateResource,
        removeResource,
        refreshResources,
        isLoading,
        setIsLoading,
    };

    return (
        <ResourceContext.Provider value={value}>
            {children}
        </ResourceContext.Provider>
    );
};

export default ResourceContext;
