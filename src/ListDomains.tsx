import React, { useContext, useEffect, useState } from 'react'
import { db } from './firebaseApp'
import { UserContext } from './UserContext'
import './ListDomains.css'

const domainsCollection = {
  collectionName: 'domains',
  fields: {
    name: 'Domain Name',
    purpose: 'purpose',
    currentRegistrar: 'currentRegistrar',
    firstRegisterd: 'firstRegisterd',
    currentExpiry: 'currentExpiry',
    expiresIn: 'expiresIn',
    released: 'released',
  }
}

type FieldDef = {
  key: string
  name: string
  datatype?: string
  readonly?: boolean
  format?: (str: string, row: any) => any
  width? : string
}

const formatRegistrar = (str: string, row: any) => {
  if (str.startsWith('http')) {
    const url = new URL(str)
    return <a href={str}>{url.host}</a>
  } else {
    return <span>{str}</span>
  }
}
const formatExpires = (str: string, row: any) => {
  const expires = new Date(row.currentExpiry).getTime()
  const today = new Date().getTime()
  const days = Math.floor((expires - today) / (1000 * 60 * 60 * 24))
  return days > 0 ? 
    <span className={(days > 0 && days < 28) ? 'warning' : ''}>Expires in {days} days</span> : 
    <>Expired {days} days ago</>
}

const formatReleased = (str: string, row: any) => {
  return (str === 'yes') ? '✔️' : ''
}

const fields: FieldDef[] = [
  { key: 'name', name: domainsCollection.fields['name'] },
  { key: 'purpose', name: domainsCollection.fields['purpose'], width: '.5fr' },
  {
    key: 'currentRegistrar',
    name: domainsCollection.fields['currentRegistrar'],
    format: formatRegistrar,
  },
  { key: 'firstRegisterd', name: domainsCollection.fields['firstRegisterd'], datatype: 'date', width: '.5fr' },
  { key: 'currentExpiry', name: domainsCollection.fields['currentExpiry'], datatype: 'date', width: '.5fr' },
  {
    key: 'expiresIn',
    name: domainsCollection.fields['expiresIn'],
    readonly: true,
    format: formatExpires,
  },
  { key: 'released', name: domainsCollection.fields['released'], datatype: 'checkbox', format: formatReleased, width: '.2fr' },
]

export function ListDomains() {
  return (
    <div className="ListDomains" style={{'gridTemplateColumns': `${fields.map(f => f.width || '1fr').join(' ')} auto`}}>
      {fields.map(({ key, name }) => (
        <div key={key} className="ListDomains-header">
          {name}
        </div>
      ))}
      <div className="ListDomains-header"></div>

      <DomainRows />
      <AddNewDomainRow />
    </div>
  )
}

function DomainRows() {
  const [rows, setRows] = useState<any[]>([])
  const user = useContext(UserContext)

  useEffect(() => {
    if (!user) return
    db.collection(domainsCollection.collectionName)
      .where('owner', '==', user.uid)
      .orderBy(domainsCollection.fields.firstRegisterd, 'asc')
      .onSnapshot((querySnapshot) => {
        const newRows: any[] = []
        querySnapshot.forEach(function (doc) {
          newRows.push({
            docId: doc.id,
            ...doc.data(),
          })
        })
        setRows(newRows)
      })
  }, [user])

  return (
    <>
      {rows.map((row) => (
        <DomainRow row={row} key={row.docId} />
      ))}
    </>
  )
}

function DomainRow({ row }: { row: any }) {
  const [editing, setEditing] = useState(false)
  const [rowChanges, setRowChanges] = useState({ ...row })
  const user = useContext(UserContext)
  useEffect(() => {
    setRowChanges(row)
  }, [editing, row])

  const doRenew = async (docId: string, currentExpiryString: string) => {
    const expiry = new Date(currentExpiryString) 
    expiry.setFullYear(expiry.getFullYear() + 1)
    const newExpiry = expiry.toISOString().substr(0, 10)

    db
      .collection(domainsCollection.collectionName)
      .doc(docId)
      .update({[domainsCollection.fields.currentExpiry]: newExpiry})
  }
  const doDelete = (docId: string) => {
    db.collection('domains').doc(docId).delete()
  }
  const doEdit = (edit: boolean) => {
    setEditing(edit)
  }
  const doSave = async () => {
    if (!user) return

    try {
      const doc = {
        ...rowChanges,
        docId: undefined,
      }
      console.log('doc:', doc)
      const docRef = await db
        .collection(domainsCollection.collectionName)
        .doc(rowChanges.docId)
        .update(rowChanges)
      console.log('Document updated: ', docRef)
      setEditing(false)
    } catch (error) {
      console.error('Error adding document: ', error)
    }
  }

  const getEditComponent = (key:string, datatype: string | undefined) => {
    const value = rowChanges[key] || ''
    if(datatype === 'checkbox') {
      return <input
      type='checkbox'
      checked={value === 'yes'}
      value="yes"
      onChange={(e) =>
        setRowChanges({ ...rowChanges, [key]: e.target.value })
      }
    />
    } else {
      return <input
      type={datatype}
      value={value}
      onChange={(e) =>
        setRowChanges({ ...rowChanges, [key]: e.target.value })
      }
    />
    }
  }

  return (
    <>
      {fields.map(({ key, datatype, format }) => (
        <div key={key} className="ListDomains-row">
          {editing ? (
            getEditComponent(key, datatype)
          ) : format ? (
            format(row[key], row)
          ) : (
            row[key]
          )}
        </div>
      ))}
      <div className="ListDomains-row">
        {editing ? (
          <>
            <button onClick={() => doSave()}>S</button>
            <button onClick={() => doEdit(false)}>C</button>
          </>
        ) : (
          <>
            <button onClick={() => doRenew(row.docId, row[domainsCollection.fields.currentExpiry])}>♽</button>
            <button onClick={() => doEdit(true)}>E</button>
            <button onClick={() => doDelete(row.docId)}>D</button>
          </>
        )}
      </div>
    </>
  )
}

function AddNewDomainRow() {
  const [newDomain, setNewDomain] = useState<any>({})
  const user = useContext(UserContext)

  const addNew = async () => {
    if (!user) return

    try {
      const doc = {
        owner: user.uid,
        ...newDomain,
      }
      console.log('doc:', doc)
      const docRef = await db.collection(domainsCollection.collectionName).add(doc)
      console.log('Document written with ID: ', docRef.id)
    } catch (error) {
      console.error('Error adding document: ', error)
    }
  }

  return (
    <>
      {fields.map(({ key, datatype, readonly }) => (
        <div key={key} className="ListDomains-footer">
          {!readonly && (
            <input
              type={datatype}
              value={newDomain[key] || ''}
              onChange={(e) =>
                setNewDomain({ ...newDomain, [key]: e.target.value })
              }
            />
          )}
        </div>
      ))}
      <div>
        <button onClick={() => addNew()}>Add</button>
      </div>
    </>
  )
}
