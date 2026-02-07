// Types
export type {
    PluginCategory,
    PluginIcon,
    PluginCompatibility,
    PluginDefinition,
    PluginDefaultConfig,
    CategoryDefinition,
    PluginRegistryEntry,
} from './types';

// Categories
export {
    CATEGORY_DEFINITIONS,
    getCategoryById,
    getCategoryIds,
    PROTOCOL_PLUGIN_IDS,
} from './categories';


// Registry
export {
    PLUGIN_REGISTRY,
    getPluginIds,
    getPluginById,
    getPluginsByCategory,
    searchPlugins,
    getCompatiblePlugins,
    getSuggestedPlugins,
    getRequiredPlugins,
    getDefaultConfig,
} from './registry';
