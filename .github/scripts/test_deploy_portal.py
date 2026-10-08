import copy
import unittest
from deploy_portal import protected_state, ready


class DeploymentTests(unittest.TestCase):
    def test_provisioned_alone_is_not_healthy(self):
        for properties in ({'provisioningState':'Provisioned'},
                           {'provisioningState':'Provisioned','healthState':'Healthy','runningState':'Activating'},
                           {'provisioningState':'Failed','healthState':'Healthy','runningState':'Running'}):
            self.assertFalse(ready({'properties':properties}))
        self.assertTrue(ready({'properties':{'provisioningState':'Provisioned','healthState':'Healthy','runningState':'Running'}}))

    def test_healthy_revision_at_replica_limit_is_running(self):
        self.assertTrue(ready({'properties':{'provisioningState':'Provisioned',
            'healthState':'Healthy','runningState':'RunningAtMaxScale'}}))
        self.assertFalse(ready({'properties':{'provisioningState':'Provisioned',
            'healthState':'Unhealthy','runningState':'RunningAtMaxScale'}}))

    def test_image_changes_allowed_but_security_and_runtime_changes_detected(self):
        app={'identity':{'userAssignedIdentities':{'runtime':{}}},'properties':{
            'configuration':{'ingress':{'allowInsecure':False},'registries':[{'identity':'runtime'}],
                             'secrets':[{'name':'signin'}]},
            'template':{'containers':[{'image':'old','env':[{'name':'PGUSER','value':'runtime'}], 'probes':[]}],
                        'scale':{'minReplicas':1}}}}
        auth={'platform':{'enabled':True}}
        expected=protected_state(app,auth)
        changed=copy.deepcopy(app);changed['properties']['template']['containers'][0]['image']='new'
        self.assertEqual(expected,protected_state(changed,auth))
        changed['properties']['template']['containers'][0]['env']=[]
        self.assertNotEqual(expected,protected_state(changed,auth))
        self.assertNotEqual(expected,protected_state(app,{'platform':{'enabled':False}}))
        changed=copy.deepcopy(app);changed['identity']={}
        self.assertNotEqual(expected,protected_state(changed,auth))


if __name__ == '__main__':unittest.main()
