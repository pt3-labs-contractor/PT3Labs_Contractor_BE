import React from 'react'
import { connect } from 'react-redux'

function ContractorList(props) {
  return (
    <div>
      <h3>Contractors:</h3>
      {props.loading ? <p>Loading...</p> : null}
      {props.error ? <p>{props.error}</p> : null}
      {props.contractors.map(contractor => (
        <p key={contractor.id}>{contractor.name}</p>
      ))}
    </div>
  )
}

const mapStateToProps = state => {
  return {
    contractors: state.accounts.contractors,
    loading: state.loading,
    error: state.error
  }
}

export default connect(mapStateToProps)(ContractorList);
