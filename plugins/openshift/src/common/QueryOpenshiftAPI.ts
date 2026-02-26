import { useState, useEffect } from 'react';
import { useApi, configApiRef, fetchApiRef } from '@backstage/core-plugin-api';

const LOG_PREFIX = '[openshift-plugin][cluster-api]';

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
            console.info(
                `${LOG_PREFIX} Querying cluster: environment=${data.environmentName}, namespace=${data.namespace}, deployments=${deploymentsUrl}, pods=${podsUrl}`,
            );
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
                    console.info(
                        `${LOG_PREFIX} Cluster data loaded: environment=${data.environmentName}, namespace=${data.namespace}, deployments=${clusterData.deployments?.length ?? 0}, pods=${clusterData.pods?.length ?? 0}`,
                    );
                })
                .catch((err: unknown) => {
                    setError(true);
                    const message = err instanceof Error ? err.message : String(err);
                    console.error(
                        `${LOG_PREFIX} Error fetching openshift cluster data: environment=${data.environmentName}, namespace=${data.namespace}: ${message}`,
                        err instanceof Error ? err : undefined,
                    );
                });
        };

        getClusterData();
    }, [data.namespaceName, backendUrl, data.environmentName, data.namespace, fetchApi]);

    return { result, loaded, error }
}

export default QueryOpenshift;
