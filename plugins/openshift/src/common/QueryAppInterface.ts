import { useState, useEffect } from 'react';
import { request } from 'graphql-request';
import { useEntity } from '@backstage/plugin-catalog-react';
import { useApi, configApiRef } from '@backstage/core-plugin-api';

const LOG_PREFIX = '[openshift-plugin][qontract]';

const QueryQontract = (query: string) => {
    type QontractApp = Record<string, any>;

    const config = useApi(configApiRef);
    const { entity } = useEntity();

    const backendUrl = config.getString('backend.baseUrl');
    const proxyUrl = `${backendUrl}/api/proxy/openshift-deployments/graphql`
    
    // state variables for saving data queried from graphql
    const [result, setResult] = useState<QontractApp>([]);
    const [loaded, setLoaded] = useState<boolean>(false);
    const [error, setError] = useState<boolean>(false);

    const getAppInterfaceNamespacePath = () => {
        const platform = entity?.metadata?.labels?.platform
        const service = entity?.metadata?.labels?.service
        return `/services/${platform}/${service}/app.yml`
    }

    // Get qontract data on load
    useEffect(() => {
        const queryQontract = async () => {
            const variables = { path: getAppInterfaceNamespacePath() };
            console.info(
                `${LOG_PREFIX} Querying App Interface: url=${proxyUrl}, path=${variables.path}, platform=${entity?.metadata?.labels?.platform}, service=${entity?.metadata?.labels?.service}`,
            );
            await request(proxyUrl, query, variables)
                .then((data: any) => {
                    if (!data?.apps_v1?.[0]?.namespaces) {
                        console.warn(
                            `${LOG_PREFIX} Unexpected response shape: expected data.apps_v1[0].namespaces. Got apps_v1=${!!data?.apps_v1}, length=${data?.apps_v1?.length}, first namespaces=${!!data?.apps_v1?.[0]?.namespaces}`,
                        );
                    }
                    setLoaded(true);
                    setResult(data.apps_v1?.[0]?.namespaces ?? []);
                })
                .catch((err: unknown) => {
                    setError(true);
                    const message = err instanceof Error ? err.message : String(err);
                    const response = err && typeof err === 'object' && 'response' in err ? (err as { response?: unknown }).response : undefined;
                    console.error(
                        `${LOG_PREFIX} Error retrieving data from qontract: ${message}`,
                        { path: variables.path, proxyUrl, response },
                        err instanceof Error ? err : undefined,
                    );
                });
        }
        queryQontract()
    }, [proxyUrl, query]);

    return { result, loaded, error }
}

export default QueryQontract;
