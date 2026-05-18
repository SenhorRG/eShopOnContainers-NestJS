import envVariables from './local-env-variables.json';
import { PageHeader } from '../shared/page-header';

type EnvVariableRow = {
  name: string;
  description: string;
};

export function EnvironmentPage() {
  const rows = envVariables as EnvVariableRow[];

  return (
    <section className="ops-page">
      <PageHeader
        title="Environment"
        description={
          <>
            Reference for root <code>.env.example</code> (values are not shown).
          </>
        }
      />
      <table className="ops-table">
        <thead>
          <tr>
            <th>Variable</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name}>
              <td>
                <code>{row.name}</code>
              </td>
              <td>{row.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
