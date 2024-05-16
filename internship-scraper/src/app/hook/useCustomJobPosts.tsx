import { useState } from 'react';
import { useBetween } from 'use-between';

const useCustomJobPosts = () => {
    const [customJobPosts, setCustomJobPosts] = useState<any[]>([]);
    return {
        customJobPosts,
        setCustomJobPosts,
    };
};

const useSharedFormState = () => useBetween(useCustomJobPosts);
export default useSharedFormState;