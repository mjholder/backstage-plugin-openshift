import { useState, useEffect } from 'react';
import { useApi, configApiRef, fetchApiRef } from '@backstage/core-plugin-api';

const QueryOpenshift = (data: any) => {
    type OpenshiftApp = Record<string, any>;

    const [result, setResult] = useState<OpenshiftApp>({});
    const [loaded, setLoaded] = useState<boolean>(false);
    const [error, setError] = useState<boolean>(false);

    // Get Backstage objects
    const config = useApi(configApiRef);
    const fetchApi = useApi(fetchApiRef);

    const backendUrl = config.getString('backend.baseUrl');

    useEffect(() => {
        const getClusterData = async () => {
            const deploymentsUrl = `${backendUrl}/api/proxy/${data.environmentName}/apis/apps/v1/namespaces/${data.namespace}/deployments`;
            const podsUrl = `${backendUrl}/api/proxy/${data.environmentName}/apis/metrics.k8s.io/v1beta1/namespaces/${data.namespace}/pods`;
            const clusterData = { deployments: [], pods: [] };
            await Promise.all([
                fetchApi.fetch(deploymentsUrl)
                    .then(response => response.json())
                    .then(response => { clusterData.deployments = response.items ?? []; }),

                fetchApi.fetch(podsUrl)
                    .then(response => response.json())
                    .then(response => { clusterData.pods = response.items ?? []; }),
            ])
                .then(() => {
                    setLoaded(true);
                    setResult(clusterData);
                })
                .catch(() => {
                    setError(true);
                });
        };

        getClusterData();
    }, [data.namespaceName, backendUrl, data.environmentName, data.namespace, fetchApi]);

    return { result, loaded, error }
}

export default QueryOpenshift;
