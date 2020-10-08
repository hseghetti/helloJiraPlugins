import SectionMessage from '@atlaskit/section-message';
import { Code } from '@atlaskit/code';
import React from 'react';

export default function Blockers(data) {
  const [panel, setPanel] = React.useState(1);

  const renderProcessedData = () => {
    return <span>TBD</span>
  };
  return (<div>
    <SectionMessage
      title={`Blocker Information`}
      actions={[
        {
          key: '1',
          onClick: () => setPanel(1),
          text: 'Show all the blockers',
        },
        {
          key: '2',
          onClick: () => setPanel(2),
          text: 'Show processed infomation',
        }
      ]}
    >
      <p>
        This is not a POC but at least it shows the information
      </p>
    </SectionMessage>
    {(panel)? <Code language="text" text={JSON.stringify(data)} />: renderProcessedData()}
  </div>);
}


